import { useCallback } from 'react'
import useFetch from './useFetch'
import useToken from './useToken'
import type { Schedule, Source, Socket } from 'chronocast'

export type ConnectionStatusType = 'connecting' | 'open' | 'closed'

interface IUseCast {
  getSourcesByFolderKeyAsync: (folderKey: string, abort: AbortController) => Promise<Source[]>
  addSourceAsync: (folderKey: string, sourceName: string, abort: AbortController) => Promise<number>
  uploadSourceAsync: (folderKey: string, sourceId: number, file: File, abort: AbortController) => Promise<void>
  deleteSourceAsync: (folderKey: string, sourceId: number, abort: AbortController) => Promise<void>
  getSourceURLAsync: (folderKey: string, sourceId: number, abort: AbortController) => Promise<string>
  getSchedulesByFolderKeyAsync: (folderKey: string, abort: AbortController) => Promise<Schedule[]>
  addScheduleAsync: (folderKey: string, schedule: Schedule, abort: AbortController) => Promise<number>
  deleteScheduleAsync: (folderKey: string, scheduleId: number, abort: AbortController) => Promise<void>
  connectSocket: (folderKey: string, onEvent: (event: Socket.Event) => void, onStatusChange?: (status: ConnectionStatusType) => void) => (() => void) | null
}

const useCast = (): IUseCast => {
  const { getAsync, postAsync, deleteAsync } = useFetch()
  const { apiToken } = useToken()

  const getSourcesByFolderKeyAsync = useCallback(async (folderKey: string, abort: AbortController) => {
    const results = await getAsync<Source[]>(`/folders/${folderKey}/sources`, { requiredAuthorize: true, abort })
    return results
  }, [getAsync])

  const addSourceAsync = useCallback(async (folderKey: string, sourceName: string, abort: AbortController) => {
    const result = await postAsync<{ id: number }>(`/folders/${folderKey}/sources`, { name: sourceName }, { requiredAuthorize: true, abort })
    return result.id
  }, [postAsync])

  const uploadSourceAsync = useCallback(async (folderKey: string, sourceId: number, file: File, abort: AbortController) => {
    const formData = new FormData()
    formData.append('file', file)
    return await postAsync<void>(`/folders/${folderKey}/sources/${sourceId}/file`, formData, { requiredAuthorize: true, abort })
  }, [postAsync])

  const getSourceURLAsync = useCallback(async (folderKey: string, sourceId: number, abort: AbortController) => {
    const result = await getAsync<{ url: string }>(`/folders/${folderKey}/sources/${sourceId}/url`, { requiredAuthorize: true, abort })
    return result.url
  }, [getAsync])

  const deleteSourceAsync = useCallback(async (folderKey: string, sourceId: number, abort: AbortController) => {
    return await deleteAsync<void>(`/folders/${folderKey}/sources/${sourceId}`, {}, { requiredAuthorize: true, abort })
  }, [deleteAsync])

  const getSchedulesByFolderKeyAsync = useCallback(async (folderKey: string, abort: AbortController) => {
    const results = await getAsync<Schedule[]>(`/folders/${folderKey}/schedules`, { requiredAuthorize: true, abort })
    return results.map(s => ({
      ...s,
      scheduledAt: new Date(s.scheduledAt)
    }))
  }, [getAsync])

  const addScheduleAsync = useCallback(async (folderKey: string, schedule: Schedule, abort: AbortController) => {
    const result = await postAsync<{ id: number }>(`/folders/${folderKey}/schedules`, schedule, { requiredAuthorize: true, abort })
    return result.id
  }, [postAsync])

  const deleteScheduleAsync = useCallback(async (folderKey: string, scheduleId: number, abort: AbortController) => {
    return await deleteAsync<void>(`/folders/${folderKey}/schedules/${scheduleId}`, {}, { requiredAuthorize: true, abort })
  }, [deleteAsync])

  const connectSocket = useCallback((
    folderKey: string,
    onEvent: (event: Socket.Event) => void,
    onStatusChange?: (status: ConnectionStatusType) => void) => {
    if (!apiToken) return null

    const baseURL = new URL(import.meta.env.VITE_API_BASE_URL)
    const wsProtocol = baseURL.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsURL = new URL(`/folders/${folderKey}/ws`, baseURL)
    wsURL.protocol = wsProtocol
    wsURL.searchParams.set('token', apiToken)

    let ws: WebSocket | null = null
    let retryCount = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let closedByClient = false

    const connect = () => {
      onStatusChange?.('connecting')
      ws = new WebSocket(wsURL)

      ws.addEventListener('message', event => {
        try {
          const data = JSON.parse(event.data) as Socket.Event
          onEvent(data)
        }
        catch (err) {
          console.error('Failed to parse schedule socket message:', err)
        }
      })
      ws.addEventListener('open', () => {
        retryCount = 0
        onStatusChange?.('open')
      })
      ws.addEventListener('close', () => {
        onStatusChange?.('closed')
        if (closedByClient) return

        const delay = Math.min(500 * Math.pow(2, retryCount), 30000)
        console.warn(`WebSocket closed. Retrying in ${delay}ms...`)
        retryCount++
        retryTimer = setTimeout(connect, delay)
      })
      ws.addEventListener('error', err => {
        console.error('WebSocket error:', err)
        ws?.close()
      })
    }

    connect()

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      ws?.close(1000, 'Client closed connection')
      closedByClient = true
    }
  }, [apiToken])

  return {
    getSourcesByFolderKeyAsync,
    addSourceAsync,
    uploadSourceAsync,
    deleteSourceAsync,
    getSourceURLAsync,
    getSchedulesByFolderKeyAsync,
    addScheduleAsync,
    deleteScheduleAsync,
    connectSocket
  }
}

export default useCast
