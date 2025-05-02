import { useCallback } from 'react'
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Schedule, ScheduleDocument, Source, SourceDocument } from '../@types'
import { scheduleConverter, sourceConverter } from '../libs/converters'
import useFirebase from './useFirebase'

interface IUseCast {
  addSourceAsync: (source: Source) => Promise<string>
  uploadSourceAsync: (folderId: string, sourceId: string, file: File) => Promise<void>
  deleteSourceAsync: (folderId: string, sourceId: string) => Promise<void>
  getSourceURLAsync: (folderId: string, sourceId: string) => Promise<string>
  getSourcesByFolderIdAsync: (folderId: string) => Promise<SourceDocument[]>
  addScheduleAsync: (schedule: Schedule) => Promise<string>
  deleteScheduleAsync: (scheduleId: string) => Promise<void>
  getSchedulesByFolderIdAsync: (folderId: string) => Promise<ScheduleDocument[]>
}

const useCast = (): IUseCast => {
  const { getFirestore, getStorage } = useFirebase()
  const db = getFirestore()
  const storage = getStorage()

  const addSourceAsync = useCallback(async (source: Source) => {
    const sourceRef = doc(collection(db, 'sources'))
      .withConverter(sourceConverter)
    await setDoc(sourceRef, source)
    return sourceRef.id
  }, [])

  const uploadSourceAsync = useCallback(async (folderId: string, sourceId: string, file: File) => {
    const sourceRef = ref(storage, `sources/${folderId}/${sourceId}`)
    const blob = new Blob([file], { type: file.type })
    await uploadBytes(sourceRef, blob)
  }, [])

  const deleteSourceAsync = useCallback(async (folderId: string, sourceId: string) => {
    const sourceRef = doc(db, `sources/${sourceId}`)
    await deleteDoc(sourceRef)

    const sourceFileRef = ref(storage, `sources/${folderId}/${sourceId}`)
    await deleteObject(sourceFileRef)
  }, [])

  const getSourceURLAsync = useCallback(async (folderId: string, sourceId: string) => {
    const sourceRef = ref(storage, `sources/${folderId}/${sourceId}`)
    const url = await getDownloadURL(sourceRef)
    return url
  }, [])

  const getSourcesByFolderIdAsync = useCallback(async (folderId: string) => {
    const sourcesRef = collection(db, 'sources')
      .withConverter(sourceConverter)
    const sourcesQuery = query(sourcesRef, where('folderId', '==', folderId))
    const sourcesDocs = await getDocs(sourcesQuery)
    const sources = sourcesDocs.docs.map(d => d.data())
    return sources
  }, [])

  const addScheduleAsync = useCallback(async (schedule: Schedule) => {
    const scheduleRef = doc(collection(db, 'schedules'))
      .withConverter(scheduleConverter)
    await setDoc(scheduleRef, schedule)
    return scheduleRef.id
  }, [])

  const deleteScheduleAsync = useCallback(async (scheduleId: string) => {
    const scheduleRef = doc(db, `schedules/${scheduleId}`)
    await deleteDoc(scheduleRef)
  }, [])

  const getSchedulesByFolderIdAsync = useCallback(async (folderId: string) => {
    const schedulesRef = collection(db, 'schedules')
      .withConverter(scheduleConverter)
    const schedulesQuery = query(schedulesRef, where('folderId', '==', folderId))
    const schedulesDocs = await getDocs(schedulesQuery)
    const schedules = schedulesDocs.docs.map(d => d.data())
    return schedules
  }, [])

  return {
    addSourceAsync,
    uploadSourceAsync,
    deleteSourceAsync,
    getSourceURLAsync,
    getSourcesByFolderIdAsync,
    addScheduleAsync,
    deleteScheduleAsync,
    getSchedulesByFolderIdAsync
  }
}

export default useCast
