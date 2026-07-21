import { DurableObject } from 'cloudflare:workers'
import type { Socket } from 'chronocast'

export type SchedulerEntry = {
  id: number
  sourceId: number
  scheduledAt: number
}

export type SourceEntry = {
  id: number
  folderKey: string
  name: string
}

type ScheduleRow = {
  id: number
  sourceId: number
  scheduledAt: number
}

export class FolderDurableObject extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => this.migrate())
  }

  private migrate(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY,
        sourceId INTEGER NOT NULL,
        scheduledAt INTEGER NOT NULL
      )
    `)
  }

  async broadcastAddSource(source: SourceEntry): Promise<void> {
    const payload: Socket.SourceAddEvent = {
      type: 'SOURCE_ADD',
      sourceId: source.id,
      folderKey: source.folderKey,
      name: source.name
    }
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(JSON.stringify(payload))
      }
      catch (err) {
        console.error('Failed to send add source notification:', err)
      }
    }
  }

  async broadcastRemoveSource(sourceId: number): Promise<void> {
    const payload: Socket.SourceRemoveEvent = {
      type: 'SOURCE_REMOVE',
      sourceId
    }
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(JSON.stringify(payload))
      }
      catch (err) {
        console.error('Failed to send remove source notification:', err)
      }
    }
  }

  async addSchedule(schedule: SchedulerEntry): Promise<void> {
    const now = new Date()
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO schedules (id, sourceId, scheduledAt) VALUES (?, ?, ?)',
      schedule.id,
      schedule.sourceId,
      schedule.scheduledAt
    )
    this.broadcastAddSchedule(schedule)
    await this.scheduleNextAlarm(now)
  }

  private broadcastAddSchedule(schedule: SchedulerEntry): void {
    const payload: Socket.ScheduleAddEvent = {
      type: 'SCHEDULE_ADD',
      scheduleId: schedule.id,
      sourceId: schedule.sourceId,
      scheduledAt: schedule.scheduledAt
    }
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(JSON.stringify(payload))
      }
      catch (err) {
        console.error('Failed to send add schedule notification:', err)
      }
    }
  }

  async removeSchedule(scheduleId: number): Promise<void> {
    const now = new Date()
    this.ctx.storage.sql.exec('DELETE FROM schedules WHERE id = ?', scheduleId)
    this.broadcastRemoveSchedule(scheduleId)
    await this.scheduleNextAlarm(now)
  }

  private broadcastRemoveSchedule(scheduleId: number): void {
    const payload: Socket.ScheduleRemoveEvent = {
      type: 'SCHEDULE_REMOVE',
      scheduleId
    }
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(JSON.stringify(payload))
      }
      catch (err) {
        console.error('Failed to send remove schedule notification:', err)
      }
    }
  }

  private getNextScheduleId(now: Date): number | null {
    const schedules = this.ctx.storage.sql
      .exec<{ id: number | null }>(
        'SELECT id FROM schedules WHERE scheduledAt > ? ORDER BY scheduledAt ASC LIMIT 1',
        now.getTime())
      .toArray()
    return schedules.length > 0 ? schedules[0].id ?? null : null
  }

  private broadcastNextScheduleId(now: Date): void {
    const scheduleId = this.getNextScheduleId(now)
    const payload: Socket.ScheduleNextEvent = {
      type: 'SCHEDULE_NEXT',
      scheduleId
    }
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(JSON.stringify(payload))
      }
      catch (err) {
        console.error('Failed to send next schedule notification:', err)
      }
    }
  }

  private async scheduleNextAlarm(now: Date): Promise<void> {
    const schedules = this.ctx.storage.sql
      .exec<{ scheduledAt: number | null }>(
        'SELECT MIN(scheduledAt) as scheduledAt FROM schedules WHERE scheduledAt > ?',
        now.getTime())
      .toArray()

    if (schedules.length > 0 && schedules[0].scheduledAt) {
      await this.ctx.storage.setAlarm(schedules[0].scheduledAt)
    }
    else {
      await this.ctx.storage.deleteAlarm()
    }

    this.broadcastNextScheduleId(now)
  }

  private broadcastConnectionCount(excludeWS?: WebSocket): void {
    const wss = this.ctx.getWebSockets()
      .filter(ws => ws !== excludeWS)
    const payload: Socket.ConnectionUpdateEvent = {
      type: 'CONNECTION_UPDATE',
      connectionCount: wss.length
    }
    for (const ws of wss) {
      if (ws === excludeWS) continue
      try {
        ws.send(JSON.stringify(payload))
      }
      catch (err) {
        console.error('Failed to send connection update notification:', err)
      }
    }
  }

  async alarm(): Promise<void> {
    const now = new Date()
    const dueSchedules = this.ctx.storage.sql
      .exec<ScheduleRow>('SELECT id, sourceId, scheduledAt FROM schedules WHERE scheduledAt <= ? ORDER BY scheduledAt DESC', now.getTime())
      .toArray()
    if (dueSchedules.length === 0) {
      await this.scheduleNextAlarm(now)
      return
    }

    const schedule = dueSchedules[0]

    this.ctx.storage.sql.exec('DELETE FROM schedules WHERE scheduledAt <= ?', now.getTime())

    const payload: Socket.SchedulePlayEvent = {
      type: 'SCHEDULE_PLAY',
      scheduleId: schedule.id,
      sourceId: schedule.sourceId
    }
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(JSON.stringify(payload))
      }
      catch (err) {
        console.error('Failed to send schedule notification:', err)
      }
    }

    await this.scheduleNextAlarm(now)
  }

  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    this.ctx.acceptWebSocket(pair[1])
    const now = new Date()

    const scheduleNextPayload: Socket.ScheduleNextEvent = {
      type: 'SCHEDULE_NEXT',
      scheduleId: this.getNextScheduleId(now)
    }
    pair[1].send(JSON.stringify(scheduleNextPayload))

    this.broadcastConnectionCount()

    return new Response(null, { status: 101, webSocket: pair[0] })
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason)
    }
    catch (err) {
      console.error('Error during WebSocket close:', err)
    }
    finally {
      this.broadcastConnectionCount(ws)
    }
  }
}
