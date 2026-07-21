export type SuccessResult = {
  success: boolean
}

export type LoggedInUser = {
  email: string
  isActive: boolean
}

export type AuthorizeURLResult = {
  url: string
}

export type AuthenticateResult = {
  loginToken: string
}

export type LoginResult = {
  apiToken: string
  user: LoggedInUser
}

export type Folder = {
  key: string
}

export type Source = {
  id: number
  folderKey: string
  name: string
}

export type Schedule = {
  id: number
  sourceId: number
  scheduledAt: Date
}

namespace Socket {
  export type ConnectionUpdateEvent = {
    type: 'CONNECTION_UPDATE'
    connectionCount: number
  }
  export type SchedulePlayEvent = {
    type: 'SCHEDULE_PLAY'
    scheduleId: number
    sourceId: number
  }
  export type ScheduleAddEvent = {
    type: 'SCHEDULE_ADD'
    scheduleId: number
    sourceId: number
    scheduledAt: number
  }
  export type ScheduleRemoveEvent = {
    type: 'SCHEDULE_REMOVE'
    scheduleId: number
  }
  export type ScheduleNextEvent = {
    type: 'SCHEDULE_NEXT'
    scheduleId: number | null
  }
  export type SourceAddEvent = {
    type: 'SOURCE_ADD'
    sourceId: number
    folderKey: string
    name: string
  }
  export type SourceRemoveEvent = {
    type: 'SOURCE_REMOVE'
    sourceId: number
  }

  export type Event =
    | ConnectionUpdateEvent
    | SchedulePlayEvent
    | ScheduleNextEvent
    | ScheduleAddEvent
    | ScheduleRemoveEvent
    | SourceAddEvent
    | SourceRemoveEvent
}
