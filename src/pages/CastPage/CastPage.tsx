import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { ScheduleDocument, SourceDocument } from '../../@types'
import useCast from '../../hooks/useCast'
import useFirebase from '../../hooks/useFirebase'

type SourceDocumentWithURL = SourceDocument & {
  url: string
}
type ScheduleDocumentWithTimeId = ScheduleDocument & {
  timerId: NodeJS.Timeout | null
}

const CastPage: React.FC = () => {
  const { folderId } = useParams()
  const navigate = useNavigate()

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
  const { logoutAsync } = useFirebase()

  const [now, setNow] = useState(new Date())
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isMuted, setIsMuted] = useState(true)

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
        alert('追加しました')
        const source = sources?.find(s => s.id === schedule.sourceId)
        if (!source) return

        const timerId = addQueue(source.url, schedule.scheduledAt.getTime() - now.getTime())

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
        alert('追加に失敗しました')
        throw err
      })
  }, [folderId, editableSchedule, sources])

  const handleDeleteSchedule = useCallback((scheduleId: string) => {
    if (!schedules) return
    if (!confirm('削除しますか？')) return
    deleteScheduleAsync(scheduleId)
      .then(() => {
        alert('削除しました')
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
        uploadSourceAsync(folderId, id, file)
          .then(async () => {
            alert('追加しました')
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
      })
      .catch(err => {
        alert('音源の追加に失敗しました')
        throw err
      })
  }, [folderId, file, editableSource])

  const handleDeleteSource = useCallback((sourceId: string) => {
    if (!folderId) return
    if (!confirm('音源を削除しますか？')) return
    deleteSourceAsync(folderId, sourceId)
      .then(() => {
        alert('削除しました')
        setSources(s => {
          if (!s) return
          const newSources = s.filter(source => source.id !== sourceId)
          return newSources
        })
      })
      .catch(err => { throw err })
  }, [folderId])

  const handlePlay = useCallback((sourceId: string) => {
    if (!audioRef.current) return

    const source = sources?.find(s => s.id === sourceId)
    if (!source) return

    audioRef.current.src = source.url
    audioRef.current.play().catch(err => console.error('Playback failed:', err))
  }, [sources])

  const handleStop = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.src = ''
  }, [])

  const handleLogout = useCallback(() => {
    if (!confirm('ログアウトしますか？')) return
    logoutAsync()
      .then(() => navigate('/'))
      .catch(err => {
        alert('ログアウトに失敗しました')
        throw err
      })
  }, [])

  const addQueue = useCallback((sourceURL: string, timeSpan: number) => {
    return setTimeout(() => {
      if (!audioRef.current) return
      audioRef.current.src = sourceURL
      audioRef.current.play()
        .catch(err => console.error('Playback failed:', err))
    }, timeSpan)
  }, [])

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
          const timeSpan = schedule.scheduledAt.getTime() - new Date().getTime()
          if (timeSpan < 0) {
            return {
              ...schedule,
              timerId: null
            }
          }

          const source = initialSources?.find(s => s.id === schedule.sourceId)
          if (!source) {
            return {
              ...schedule,
              timerId: null
            }
          }

          const timerId = addQueue(source.url, timeSpan)

          return {
            ...schedule,
            timerId
          }
        }))
        setSchedules(schedulesWithTimeIds)
      })
      .catch(err => { throw err })
  }, [initialSources, schedules])

  return (
    <Container>
      {!isMuted && (
        <audio ref={audioRef} />
      )}
      <IndicatorSection>
        <Clock>
          {now.toLocaleTimeString()}
        </Clock>
        <Indicators>
          <Indicator>
            <IndicatorStatusIcon isActive={true} />
            <IndicatorText>フォルダ: {folderId}</IndicatorText>
          </Indicator>
          <Indicator>
            <IndicatorStatusIcon isActive={isMuted} />
            <IndicatorText>{isMuted ? 'ミュート中' : 'ミュート解除中'}</IndicatorText>
          </Indicator>
        </Indicators>
        <ControlArea>
          {isMuted && (
            <ControlButton onClick={() => setIsMuted(false)}>
              ミュートを解除する
            </ControlButton>
          )}
          {!isMuted && (
            <ControlButton onClick={() => setIsMuted(true)}>
              ミュートする
            </ControlButton>
          )}
          <ControlButton onClick={handleStop}>
            放送停止
          </ControlButton>
        </ControlArea>
        <ControlArea>
          <ControlButton onClick={handleLogout}>
            ログアウト
          </ControlButton>
        </ControlArea>
      </IndicatorSection>
      <DashboardSection>
        <h2>音源管理</h2>

        <fieldset>
          <legend>音源追加</legend>
          <input
            onChange={e => setEditableSource(s => ({ ...s, name: e.target.value }))}
            placeholder="音源名"
            type="text"
            value={editableSource.name} />
          <input
            accept="audio/mp3"
            onChange={e => setFile(e.target.files?.[0])}
            type="file" />
          <button onClick={handleAddSource}>音源追加</button>
        </fieldset>

        <table>
          <thead>
            <tr>
              <th>音源</th>
              <th>試聴</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sources?.map(source => (
              <tr key={source.id}>
                <td>{source.name} <small>({source.id})</small></td>
                <td><button onClick={() => handlePlay(source.id)}>試聴</button></td>
                <td><button onClick={() => handleDeleteSource(source.id)}>削除</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>放送スケジュール</h2>

        <fieldset>
          <legend>スケジュール追加</legend>
          <select
            onChange={e => setEditableSchedule(s => ({ ...s, sourceId: e.target.value }))}
            value={editableSchedule.sourceId}>
            <option value="">音源を選択</option>
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
          <button onClick={handleAddSchedule}>スケジュール追加</button>
        </fieldset>

        <table>
          <thead>
            <tr>
              <th style={{ width: '25%' }}>放送開始時刻</th>
              <th>音源名</th>
              <th style={{ width: '25%' }}>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {schedules?.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
              .map(schedule => {
                const source = sources?.find(s => s.id === schedule.sourceId)
                return (
                  <tr key={schedule.id}>
                    <td>{schedule.scheduledAt.toLocaleString()}</td>
                    <td>{source?.name ?? '-'}</td>
                    <td>{schedule.timerId ? '設定済' : '-'}</td>
                    <td><button onClick={() => handleDeleteSchedule(schedule.id)}>削除</button></td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </DashboardSection>
    </Container>
  )
}

export default CastPage

const Container = styled.div`
  display: grid;
  grid-template-columns: 40% 1fr;
  @media screen and (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`
const IndicatorSection = styled.div`
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  @media screen and (max-width: 840px) {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
  }
`
const DashboardSection = styled.div`
  padding: 40px;
  @media screen and (max-width: 840px) {
    padding: 20px;
  }
`

const Clock = styled.div`
  padding: 20px;
  font-size: 3em;
  font-weight: bold;
  text-align: center;
  background-color: var(--panel-background-color);
`
const Indicators = styled.div`
`
const Indicator = styled.div`
  padding: 5px;
  display: grid;
  gap: 10px;
  grid-template-columns: 24px 1fr;
`
const IndicatorStatusIcon = styled.div<{ isActive: boolean }>`
  &:before {
    content: '';
    display: block;
    width: 24px;
    height: 24px;
    background-color: ${props => props.isActive ? 'var(--indicator-active-color)' : 'var(--indicator-inactive-color)'};
    border-radius: 50%;
    box-shadow: 0 0 10px ${props => props.isActive ? 'var(--indicator-active-color)' : 'var(--indicator-inactive-color)'};
  }
`
const IndicatorText = styled.div``
const ControlArea = styled.div`
  display: flex;
  flex-flow: column;
  gap: 10px;
`
const ControlButton = styled.button`
  padding: 10px;
  font-size: 1rem;
`
