import type { ScheduleDocument, SourceDocument } from '../@types'
import type { DocumentData, FirestoreDataConverter } from 'firebase/firestore'

export const sourceConverter: FirestoreDataConverter<SourceDocument> = {
  toFirestore: (source: SourceDocument) => ({
    name: source.name,
    folderId: source.folderId
  }),
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      name: data.name,
      folderId: data.folderId
    }
  }
}

export const scheduleConverter: FirestoreDataConverter<ScheduleDocument> = {
  toFirestore: (schedule: ScheduleDocument) => ({
    folderId: schedule.folderId,
    sourceId: schedule.sourceId,
    scheduledAt: schedule.scheduledAt
  }),
  fromFirestore: (snapshot: DocumentData) => {
    const data = snapshot.data()
    return {
      id: snapshot.id,
      folderId: data.folderId,
      sourceId: data.sourceId,
      scheduledAt: new Date(data.scheduledAt.seconds * 1000)
    }
  }
}
