import { useCallback } from 'react'
import useFetch from './useFetch'
import type { Schedule, Source } from 'chronocast'

interface IUseCast {
  getSourcesByFolderKeyAsync: (folderKey: string, abort: AbortController) => Promise<Source[]>
  addSourceAsync: (folderKey: string, sourceName: string, abort: AbortController) => Promise<number>
  uploadSourceAsync: (folderKey: string, sourceId: number, file: File, abort: AbortController) => Promise<void>
  deleteSourceAsync: (folderKey: string, sourceId: number, abort: AbortController) => Promise<void>
  getSourceURLAsync: (folderKey: string, sourceId: number, abort: AbortController) => Promise<string>
  getSchedulesByFolderKeyAsync: (folderKey: string, abort: AbortController) => Promise<Schedule[]>
  addScheduleAsync: (folderKey: string, schedule: Schedule, abort: AbortController) => Promise<number>
  deleteScheduleAsync: (folderKey: string, scheduleId: number, abort: AbortController) => Promise<void>
}

const useCast = (): IUseCast => {
  const { getAsync, postAsync, deleteAsync } = useFetch()

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
    return await postAsync<void>(`/folders/${folderKey}/sources/${sourceId}`, formData, { requiredAuthorize: true, abort })
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

  return {
    getSourcesByFolderKeyAsync,
    addSourceAsync,
    uploadSourceAsync,
    deleteSourceAsync,
    getSourceURLAsync,
    getSchedulesByFolderKeyAsync,
    addScheduleAsync,
    deleteScheduleAsync
  }
}

export default useCast
