export interface Source {
  name: string
  folderId: string
}
export type SourceDocument = Source & {
  id: string
}

export interface Schedule {
  folderId: string
  sourceId: string
  scheduledAt: Date
}
export type ScheduleDocument = Schedule & {
  id: string
}
