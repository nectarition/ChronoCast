import { useCallback } from 'react'
import useFetch from './useFetch'
import type { Schedule, Source } from 'chronocast'

interface IUseCast {
  getSourcesByFolderKeyAsync: (folderKey: string, abort: AbortController) => Promise<Source[]>
  addSourceAsync: (folderKey: string, source: Source, abort: AbortController) => Promise<number>
  deleteSourceAsync: (folderKey: string, sourceId: number, abort: AbortController) => Promise<void>
  getSourceURLAsync: (folderKey: string, sourceId: number, abort: AbortController) => Promise<string>
  getSchedulesByFolderKeyAsync: (folderKey: string, abort: AbortController) => Promise<Schedule[]>
  addScheduleAsync: (folderKey: string, schedule: Schedule, abort: AbortController) => Promise<number>
  deleteScheduleAsync: (folderKey: string, scheduleId: number, abort: AbortController) => Promise<void>
}

const useCast = (): IUseCast => {
  const { getAsync } = useFetch()

  const getSourcesByFolderKeyAsync = useCallback(async (folderKey: string, abort: AbortController) => {
    const results = await getAsync<Source[]>(`/folders/${folderKey}/sources`, { requiredAuthorize: true, abort })
    return results
  }, [getAsync])

  const addSourceAsync = useCallback(async (folderKey: string, source: Source, file: File, abort: AbortController) => {
  }, [getAsync])

  const deleteSourceAsync = useCallback(async (folderKey: string, sourceId: number, abort: AbortController) => {
  }, [getAsync])

  const getSourceURLAsync = useCallback(async (folderKey: string, sourceId: number, abort: AbortController) => {
  }, [getAsync])

  const getSchedulesByFolderKeyAsync = useCallback(async (folderKey: string, abort: AbortController) => {
    const results = await getAsync<Schedule[]>(`/folders/${folderKey}/schedules`, { requiredAuthorize: true, abort })
    return results
  }, [getAsync])

  const addScheduleAsync = useCallback(async (folderKey: string, schedule: Schedule, abort: AbortController) => {
  }, [getAsync])

  const deleteScheduleAsync = useCallback(async (folderKey: string, scheduleId: number, abort: AbortController) => {
  }, [])

  return {
    getSourcesByFolderKeyAsync,
    addSourceAsync,
    deleteSourceAsync,
    getSourceURLAsync,
    getSchedulesByFolderKeyAsync,
    addScheduleAsync,
    deleteScheduleAsync
  }
}

export default useCast
