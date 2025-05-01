import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { ScheduleDocument, SourceDocument } from '../../@types'
import useCast from '../../hooks/useCast'

type SourceDocumentWithURL = SourceDocument & {
  url: string
}
type ScheduleDocumentWithTimeId = ScheduleDocument & {
  timerId: NodeJS.Timeout | null
}

const CastPage: React.FC = () => {
  const { folderId } = useParams()
  const {
    getSourcesAsync,
    getSchedulesAsync,
    addScheduleAsync,
    addSourceAsync,
    deleteScheduleAsync,
    deleteSourceAsync,
    getSourceURLAsync,
    uploadSourceAsync
  } = useCast()

  const [now, setNow] = useState(new Date())

  const [initialSources, setInitialSources] = useState<SourceDocumentWithURL[]>()
  const [sources, setSources] = useState<SourceDocumentWithURL[]>()
  const [schedules, setSchedules] = useState<ScheduleDocumentWithTimeId[]>()

  const [file, setFile] = useState<File>()

  const [editableSource, setEditableSource] = useState({
    name: ''
  })
  const [editableSchedule, setEditableSchedule] = useState({
    sourceId: '',
    scheduledAt: ''
  })

  const handleAddSchedule = useCallback(() => {
    if (!folderId) return

    const schedule = {
      ...editableSchedule,
      folderId,
      scheduledAt: new Date(editableSchedule.scheduledAt)
    }
    addScheduleAsync(schedule)
      .then(id => {
        alert('Schedule added successfully')
        const source = sources?.find(s => s.id === schedule.sourceId)
        if (!source) return
        const timerId = setTimeout(() => {
          const audio = new Audio(source.url)
          audio.play().catch(err => console.error('Playback failed:', err))
        }, schedule.scheduledAt.getTime() - now.getTime())

        setSchedules(s => s && ([...s, {
          ...schedule,
          id,
          timerId
        }]))
        setEditableSchedule({
          sourceId: '',
          scheduledAt: ''
        })
      })
      .catch(err => {
        console.error('Failed to add schedule:', err)
        alert('Failed to add schedule')
      })
  }, [folderId, editableSchedule, sources])

  const handleDeleteSchedule = useCallback((scheduleId: string) => {
    if (!schedules) return
    if (!confirm('Delete schedule?')) return
    deleteScheduleAsync(scheduleId)
      .then(() => {
        alert('Delete successful')
        const schedule = schedules.find(s => s.id === scheduleId)
        if (schedule?.timerId) {
          clearTimeout(schedule.timerId)
        }

        setSchedules(s => {
          if (!s) return
          const newSchedules = s.filter(schedule => schedule.id !== scheduleId)
          return newSchedules
        })
      })
      .catch(err => { throw err })
  }, [schedules])

  const handleAddSource = useCallback(() => {
    if (!folderId || !file) return

    const source = {
      ...editableSource,
      folderId
    }
    addSourceAsync(source)
      .then(id => {
        alert('Source added successfully')
        uploadSourceAsync(folderId, id, file)
          .then(async () => {
            alert('Upload successful')
            const url = await getSourceURLAsync(folderId, id)
            setSources(s => s && ([...s, {
              ...source,
              id,
              url
            }]))
            setEditableSource({
              name: ''
            })
          })
          .catch(err => {
            console.error('Upload failed:', err)
            alert('Upload failed')
          })
      })
      .catch(err => {
        console.error('Failed to add source:', err)
        alert('Failed to add source')
      })
  }, [folderId, editableSource])

  const handleDeleteSource = useCallback((sourceId: string) => {
    if (!folderId) return
    if (!confirm('Delete source?')) return
    deleteSourceAsync(folderId, sourceId)
      .then(() => {
        alert('Delete successful')
        setSources(s => {
          if (!s) return
          const newSources = s.filter(source => source.id !== sourceId)
          return newSources
        })
      })
      .catch(err => { throw err })
  }, [folderId])

  const handlePlay = useCallback((sourceId: string) => {
    const source = sources?.find(s => s.id === sourceId)
    if (!source) return
    const audio = new Audio(source.url)
    audio.play().catch(err => console.error('Playback failed:', err))
  }, [sources])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 500)
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    getSourcesAsync()
      .then(async fetchedSources => {
        const sourcesWithUrls = await Promise.all(fetchedSources.map(async source => {
          const url = await getSourceURLAsync(source.folderId, source.id)
          console.log(url)
          return {
            ...source,
            url
          }
        }))
        setInitialSources(sourcesWithUrls)
        setSources(sourcesWithUrls)
      })
      .catch(err => { throw err })
  }, [])

  useEffect(() => {
    if (!initialSources || schedules?.length) return
    getSchedulesAsync()
      .then(async fetchedSchedules => {
        const schedulesWithTimeIds = await Promise.all(fetchedSchedules.map(async schedule => {
          const timeSpan = schedule.scheduledAt.getTime() - now.getTime()
          if (timeSpan < 0) {
            return {
              ...schedule,
              timerId: null
            }
          }

          const timerId = setTimeout(() => {
            const source = initialSources?.find(s => s.id === schedule.sourceId)
            if (source) {
              const audio = new Audio(source.url)
              audio.play().catch(err => console.error('Playback failed:', err))
            }
          }, timeSpan)

          return {
            ...schedule,
            timerId
          }
        }))
        setSchedules(schedulesWithTimeIds)
      })
      .catch(err => { throw err })
  }, [initialSources, now, schedules])

  return (
    <Container>
      <IndicatorArea>
        <Clock>
          {now.toLocaleTimeString()}
        </Clock>
      </IndicatorArea>
      <ControllerArea>
        <h2>Sources</h2>
        <table>
          <thead>
            <tr>
              <th>Source Path</th>
              <th>Source Name</th>
              <th>Play</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            {sources?.map(source => (
              <tr key={source.id}>
                <td>{source.folderId}/{source.id}</td>
                <td>{source.name}</td>
                <td><button onClick={() => handlePlay(source.id)}>Play</button></td>
                <td><button onClick={() => handleDeleteSource(source.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <fieldset>
          <legend>Source</legend>
          <input
            onChange={e => setEditableSource(s => ({ ...s, name: e.target.value }))}
            placeholder="Source Name"
            type="text"
            value={editableSource.name} />
          <input
            accept="audio/mp3"
            onChange={e => setFile(e.target.files?.[0])}
            type="file" />
          <button onClick={handleAddSource}>Add Source</button>
        </fieldset>

        <h2>Schedules</h2>
        <table>
          <thead>
            <tr>
              <th>Scheduled Time</th>
              <th>Source Path</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            {schedules?.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()).map(schedule => (
              <tr key={schedule.id}>
                <td>{schedule.scheduledAt.toLocaleString()}</td>
                <td>{schedule.folderId}/{schedule.sourceId}</td>
                <td><button onClick={() => handleDeleteSchedule(schedule.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <fieldset>
          <legend>Schedule</legend>
          <select
            onChange={e => setEditableSchedule(s => ({ ...s, sourceId: e.target.value }))}
            value={editableSchedule.sourceId}>
            <option value="">Select Source</option>
            {sources?.map(source => (
              <option
                key={source.id}
                value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
          <input
            onChange={e => setEditableSchedule(s => ({ ...s, scheduledAt: e.target.value }))}
            placeholder="Scheduled Time"
            type="datetime-local"
            value={editableSchedule.scheduledAt} />
          <button onClick={handleAddSchedule}>Add Schedule</button>
        </fieldset>

      </ControllerArea>
    </Container>
  )
}

export default CastPage

const Container = styled.div`
  display: grid;
  grid-template-columns: 30% 1fr;
`
const IndicatorArea = styled.div`
  padding: 40px;
`
const Clock = styled.div`
  font-size: 3em;
  font-weight: bold;
  text-align: center;
`
const ControllerArea = styled.div`
  padding: 40px;
`
