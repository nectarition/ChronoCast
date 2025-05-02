import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import { Play, Power, Prohibit, SignOut, SpeakerSimpleHigh, SpeakerSimpleSlash, Trash } from '@phosphor-icons/react'
import { ScheduleDocument, SourceDocument } from '../../@types'
import IconLabel from '../../components/IconLabel'
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
    getSourcesByFolderIdAsync,
    getSchedulesByFolderIdAsync,
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

  const [isOnAir, setIsOnAir] = useState(false)
  const [playingSource, setPlayingSource] = useState<SourceDocumentWithURL | null>()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

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

  const resetDuration = useCallback(() => {
    setDuration(0)
    setCurrentTime(0)
  }, [])

  const handleEndAudio = useCallback(() => {
    setPlayingSource(null)
    resetDuration()
  }, [])

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.src = ''
    handleEndAudio()
    resetDuration()
  }, [])

  const setOnAir = useCallback((isOnAir: boolean) => {
    setIsOnAir(isOnAir)
    if (!isOnAir) {
      stopAudio()
    }
  }, [])

  const setMute = useCallback((isMute: boolean) => {
    if (!audioRef.current) return
    setIsMuted(isMute)
    audioRef.current.muted = isMute
  }, [])

  const playWithSource = useCallback((source: SourceDocumentWithURL) => {
    if (!audioRef.current) return
    resetDuration()
    setPlayingSource(source)
    audioRef.current.src = source.url
    audioRef.current.play()
      .catch(err => console.error('Playback failed:', err))
  }, [])

  const addQueue = useCallback((sourceId: string, timeSpan: number) => {
    const source = sources?.find(s => s.id === sourceId)
    if (!source) return
    return setTimeout(() => playWithSource(source), timeSpan)
  }, [sources])

  const formatSeconds = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.ceil(seconds % 60)
    const formattedMinutes = String(minutes).padStart(1, '0')
    const formattedSeconds = String(remainingSeconds).padStart(2, '0')
    return `${formattedMinutes}:${formattedSeconds}`
  }, [])

  const handleAddSchedule = useCallback(() => {
    if (!folderId || !sources) return

    const schedule = {
      ...editableSchedule,
      folderId,
      scheduledAt: new Date(editableSchedule.scheduledAt)
    }
    addScheduleAsync(schedule)
      .then(id => {
        const source = sources?.find(s => s.id === schedule.sourceId)
        if (!source) return

        const timerId = addQueue(source.id, schedule.scheduledAt.getTime() - new Date().getTime())
        if (!timerId) return

        setSchedules(s => s && ([...s, {
          ...schedule,
          id,
          timerId
        }]))
        setEditableSchedule({
          sourceId: '',
          scheduledAt: ''
        })

        alert('追加しました')
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

  const handleManualPlay = useCallback((sourceId: string) => {
    const source = sources?.find(s => s.id === sourceId)
    if (!source) return
    playWithSource(source)
  }, [sources])

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }, [])

  const handleUpdateTime = useCallback(() => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
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

  useEffect(() => {
    if (!folderId) return
    getSourcesByFolderIdAsync(folderId)
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
  }, [folderId])

  useEffect(() => {
    if (!folderId || !initialSources || schedules?.length) return

    getSchedulesByFolderIdAsync(folderId)
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

          const timerId = addQueue(source.id, timeSpan)
          if (!timerId) {
            return {
              ...schedule,
              timerId: null
            }
          }

          return {
            ...schedule,
            timerId
          }
        }))
        setSchedules(schedulesWithTimeIds)
      })
      .catch(err => { throw err })
  }, [initialSources, schedules])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 500)
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return (
    <Container>
      {isOnAir && (
        <audio
          onEnded={handleEndAudio}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleUpdateTime}
          ref={audioRef} />
      )}
      <IndicatorSection>
        <Clock>
          {now.toLocaleTimeString()}
        </Clock>
        <Indicators>
          <Indicator>
            <IndicatorStatusIcon isActive={!isOnAir} />
            <IndicatorText>{isOnAir ? 'ON AIR' : 'STAND BY'}</IndicatorText>
          </Indicator>
          <Indicator>
            <IndicatorStatusIcon isActive={isMuted} />
            <IndicatorText>{isMuted ? 'ミュート中' : 'ミュート解除中'}</IndicatorText>
          </Indicator>
          <Indicator>
            <IndicatorStatusIcon isActive={!playingSource} />
            <IndicatorText>音源: {playingSource?.name ?? '-'}</IndicatorText>
          </Indicator>
          <Indicator>
            <IndicatorStatusIcon isActive={!playingSource} />
            <IndicatorText>再生位置: {formatSeconds(currentTime)}/{formatSeconds(duration)}</IndicatorText>
          </Indicator>
          <Indicator>
            <IndicatorStatusIcon isActive={!folderId} />
            <IndicatorText>フォルダ: {folderId}</IndicatorText>
          </Indicator>
        </Indicators>
        <ControlArea>
          <ControlButton onClick={() => setOnAir(!isOnAir)}>
            <IconLabel
              icon={<Power weight="regular" />}
              label={`主電源を${!isOnAir ? '入れる' : '切る'}`} />
          </ControlButton>
          <ControlButton onClick={() => setMute(!isMuted)}>
            <IconLabel
              icon={isMuted ? <SpeakerSimpleHigh weight="regular" /> : <SpeakerSimpleSlash weight="regular" />}
              label={`ミュート${isMuted ? 'を解除する' : 'する'}`} />
          </ControlButton>
          <ControlButton onClick={stopAudio}>
            <IconLabel
              icon={<Prohibit weight="regular" />}
              label="放送停止" />
          </ControlButton>
        </ControlArea>
        <ControlArea>
          <ControlButton onClick={handleLogout}>
            <IconLabel
              icon={<SignOut weight="fill" />}
              label="ログアウト" />
          </ControlButton>
        </ControlArea>
      </IndicatorSection>
      <DashboardSection>
        <h2>放送スケジュール</h2>

        <fieldset>
          <legend>スケジュール追加</legend>
          <select
            onChange={e => setEditableSchedule(s => ({ ...s, sourceId: e.target.value }))}
            value={editableSchedule.sourceId}>
            <option value="">音源を選択</option>
            {sources?.sort((a, b) => a.name.localeCompare(b.name))
              .map(source => (
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
              <th>音源</th>
              <th style={{ width: '25%' }}>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {!schedules && (
              <tr>
                <td colSpan={4}>読み込み中です…</td>
              </tr>
            )}
            {schedules?.length === 0 && (
              <tr>
                <td colSpan={4}>スケジュールがありません</td>
              </tr>
            )}
            {schedules?.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
              .map(schedule => {
                const source = sources?.find(s => s.id === schedule.sourceId)
                return (
                  <tr key={schedule.id}>
                    <td>{schedule.scheduledAt.toLocaleString()}</td>
                    <td>{source?.name ?? '-'}</td>
                    <td>{schedule.timerId ? '設定済' : '-'}</td>
                    <td>
                      <Button onClick={() => handleDeleteSchedule(schedule.id)}>
                        <Trash weight="fill" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>

        <h2>音源管理</h2>

        <fieldset>
          <legend>音源追加</legend>
          <input
            accept="audio/mp3"
            onChange={e => setFile(e.target.files?.[0])}
            type="file" />
          <input
            onChange={e => setEditableSource(s => ({ ...s, name: e.target.value }))}
            placeholder="音源名"
            type="text"
            value={editableSource.name} />
          <button onClick={handleAddSource}>音源追加</button>
        </fieldset>

        <table>
          <thead>
            <tr>
              <th>音源</th>
              <th>再生</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {!sources && (
              <tr>
                <td colSpan={3}>読み込み中です…</td>
              </tr>
            )}
            {sources?.length === 0 && (
              <tr>
                <td colSpan={3}>音源がありません</td>
              </tr>
            )}
            {sources?.sort((a, b) => a.name.localeCompare(b.name))
              .map(source => (
                <tr key={source.id}>
                  <td>{source.name} <small>({source.id})</small></td>
                  <td>
                    <Button onClick={() => handleManualPlay(source.id)}>
                      <Play weight="fill" />
                    </Button>
                  </td>
                  <td>
                    <Button onClick={() => handleDeleteSource(source.id)}>
                      <Trash weight="fill" />
                    </Button>
                  </td>
                </tr>
              ))}
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
  height: 100%;
  overflow: hidden;
  @media screen and (max-width: 840px) {
    grid-template-columns: 1fr;
    height: auto;
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
  height: 100%;
  overflow: auto;
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
  padding-left: 0;
  display: grid;
  gap: 5px;
  grid-template-columns: 24px 1fr;
`
const IndicatorStatusIcon = styled.div<{ isActive: boolean }>`
  position: relative;
  &:before {
    content: '';
    display: block;
    width: 16px;
    height: 16px;
    position: absolute;
    top: 15%;
    left: 15%;
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
  outline: none;
  border-radius: 5px;
  border: 1px solid var(--button-border-color);
  background-color: var(--button-background-color);
  color: var(--button-text-color);
  transition: background-color 0.2s ease;
  cursor: pointer;
  &:active {
    background-color: var(--button-background-active-color);
  }
`
const Button = styled(ControlButton)`
  display: inline-block;
  svg {
    width: 18px;
    height: 18px;
    fill: var(--button-text-color);
  }
`
