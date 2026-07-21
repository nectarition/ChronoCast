import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from '@emotion/styled'
import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  PlayIcon,
  SpeakerSimpleHighIcon,
  SpeakerSimpleSlashIcon,
  StopIcon,
  TrashIcon
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import FormButton from '../../components/Form/FormButton'
import FormInput from '../../components/Form/FormInput'
import FormItem from '../../components/Form/FormItem'
import FormLabel from '../../components/Form/FormLabel'
import FormSection from '../../components/Form/FormSection'
import FormSelect from '../../components/Form/FormSelect'
import IconLabel from '../../components/Parts/IconLabel'
import buttonStyle from '../../components/mixins/buttonStyle'
import useCast, { ConnectionStatusType } from '../../hooks/useCast'
import CastLayout from '../../layouts/CastLayout/CastLayout'
import type { Schedule, Source } from 'chronocast'

type SourceWithURL = Source & {
  url: string
}

const CastPage: React.FC = () => {
  const { folderKey } = useParams()
  const {
    getSourcesByFolderKeyAsync,
    getSchedulesByFolderKeyAsync,
    addScheduleAsync,
    addSourceAsync,
    deleteScheduleAsync,
    deleteSourceAsync,
    getSourceURLAsync,
    uploadSourceAsync,
    connectSocket
  } = useCast()

  const [now, setNow] = useState(new Date())
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>()
  const [connectionCount, setConnectionCount] = useState(0)

  const [playingSource, setPlayingSource] = useState<SourceWithURL | null>()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [initialSources, setInitialSources] = useState<SourceWithURL[]>()
  const [sources, setSources] = useState<SourceWithURL[]>()
  const [schedules, setSchedules] = useState<Schedule[]>()
  const [nextScheduleId, setNextScheduleId] = useState<number | null>(null)

  const [file, setFile] = useState<File>()
  const [sourceName, setSourceName] = useState('')
  const [editableSchedule, setEditableSchedule] = useState({
    sourceId: 0,
    scheduledAt: ''
  })

  const isActive = useMemo(() => {
    if (connectionStatus !== 'open' || isMuted) return null
    if (connectionStatus === 'open' && isMuted) return false
    return !!playingSource
  }, [connectionStatus, isMuted, playingSource])

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

  const playWithSource = useCallback((source: SourceWithURL) => {
    if (!audioRef.current || audioRef.current.muted) return
    resetDuration()
    setPlayingSource(source)
    audioRef.current.src = source.url
    audioRef.current.play()
      .catch(err => console.error('Playback failed:', err))
  }, [])

  const formatSeconds = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.ceil(seconds % 60)
    const formattedMinutes = String(minutes).padStart(1, '0')
    const formattedSeconds = String(remainingSeconds).padStart(2, '0')
    return `${formattedMinutes}:${formattedSeconds}`
  }, [])

  const handleAddSchedule = useCallback(() => {
    if (!folderKey || !sources || !schedules) return

    const now = new Date()
    if (now.getTime() > new Date(editableSchedule.scheduledAt).getTime()) {
      toast.error('過去の時刻は指定できません')
      return
    }
    else if (schedules.some(s => s.scheduledAt.getTime() === new Date(editableSchedule.scheduledAt).getTime())) {
      toast.error('同じ時刻のスケジュールは追加できません')
      return
    }

    const schedule: Schedule = {
      ...editableSchedule,
      id: 0,
      scheduledAt: new Date(editableSchedule.scheduledAt)
    }
    const abort = new AbortController()
    addScheduleAsync(folderKey, schedule, abort)
      .then(() => {
        setEditableSchedule({
          sourceId: 0,
          scheduledAt: ''
        })
      })
      .catch(err => {
        toast.error('追加に失敗しました')
        throw err
      })
  }, [folderKey, editableSchedule, sources, addScheduleAsync])

  const handleDeleteSchedule = useCallback((scheduleId: number) => {
    if (!folderKey) return
    if (!confirm('削除しますか？')) return
    const abort = new AbortController()
    deleteScheduleAsync(folderKey, scheduleId, abort)
      .catch(err => {
        toast.error('削除に失敗しました')
        throw err
      })
  }, [folderKey, deleteScheduleAsync])

  const handleAddSource = useCallback(() => {
    if (!folderKey || !file || !sourceName) return

    const abort = new AbortController()
    addSourceAsync(folderKey, sourceName, abort)
      .then(id => {
        uploadSourceAsync(folderKey, id, file, abort)
          .then(async () => {
            setSourceName('')
            setFile(undefined)
          })
      })
      .catch(err => {
        toast.error('音源の追加に失敗しました')
        throw err
      })
  }, [folderKey, file, sourceName, addSourceAsync, uploadSourceAsync])

  const handleDeleteSource = useCallback((sourceId: number) => {
    if (!folderKey) return
    if (!confirm('音源を削除しますか？')) return
    const abort = new AbortController()
    deleteSourceAsync(folderKey, sourceId, abort)
      .catch(err => {
        toast.error('音源の削除に失敗しました')
        throw err
      })
  }, [folderKey, deleteSourceAsync])

  const handleManualPlay = useCallback((sourceId: number) => {
    if (isMuted || !sources) return
    const source = sources.find(s => s.id === sourceId)
    if (!source) return
    playWithSource(source)
  }, [isMuted, sources])

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }, [])

  const handleUpdateTime = useCallback(() => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }, [])

  const handleRefresh = useCallback((abort?: AbortController) => {
    if (!folderKey) return
    const abortController = abort ?? new AbortController()
    getSourcesByFolderKeyAsync(folderKey, abortController)
      .then(async fetchedSources => {
        const sourcesWithUrls = await Promise.all(fetchedSources.map(async source => {
          const url = await getSourceURLAsync(source.folderKey, source.id, abortController)
          return {
            ...source,
            url
          }
        }))
        setInitialSources(sourcesWithUrls)
        setSources(sourcesWithUrls)
        toast.success('音源を読み込みました')
      })
      .catch(err => {
        if (err.name !== 'APIError') return
        toast.error(err.message)
        throw err
      })
  }, [folderKey, getSourcesByFolderKeyAsync, getSourceURLAsync])

  useEffect(() => {
    const abort = new AbortController()
    handleRefresh(abort)
    return () => abort.abort()
  }, [handleRefresh])

  useEffect(() => {
    if (!folderKey || !initialSources) return
    const abort = new AbortController()
    getSchedulesByFolderKeyAsync(folderKey, abort)
      .then(fetchedSchedules => {
        setSchedules(fetchedSchedules)
        toast.success('スケジュールを読み込みました')
      })
      .catch(err => {
        if (err.name !== 'APIError') return
        toast.error(err.message)
        throw err
      })
    return () => {
      abort.abort()
    }
  }, [folderKey, initialSources, getSchedulesByFolderKeyAsync])

  useEffect(() => {
    if (!folderKey || !sources) return
    const abort = new AbortController()
    const disconnectSocket = connectSocket(
      folderKey,
      event => {
        switch (event.type) {
          case 'CONNECTION_UPDATE':
            setConnectionCount(event.connectionCount)
            return
          case 'SOURCE_ADD': {
            const newSource: SourceWithURL = {
              id: event.sourceId,
              folderKey: event.folderKey,
              name: event.name,
              url: ''
            }
            getSourceURLAsync(event.folderKey, event.sourceId, abort)
              .then(url => {
                newSource.url = url
                setSources(s => s && ([...s, newSource]))
                toast.success('音源が追加されました')
              })
            return
          }
          case 'SOURCE_REMOVE':
            setSources(s => s && s.filter(source => source.id !== event.sourceId))
            toast.success('音源が削除されました')
            return
          case 'SCHEDULE_NEXT':
            setNextScheduleId(event.scheduleId)
            return
          case 'SCHEDULE_PLAY': {
            const source = sources.find(s => s.id === event.sourceId)
            if (!source) return
            playWithSource(source)
            return
          }
          case 'SCHEDULE_ADD': {
            const source = sources.find(s => s.id === event.sourceId)
            if (!source) return
            setSchedules(s => s && ([...s, {
              id: event.scheduleId,
              sourceId: event.sourceId,
              scheduledAt: new Date(event.scheduledAt)
            }]))
            toast.success('スケジュールが追加されました')
            return
          }
          case 'SCHEDULE_REMOVE':
            setSchedules(s => s && s.filter(schedule => schedule.id !== event.scheduleId))
            toast.success('スケジュールが削除されました')
            return
        }
      },
      setConnectionStatus)
    if (!disconnectSocket) return

    return () => {
      disconnectSocket()
      abort.abort()
    }
  }, [folderKey, sources, connectSocket, getSourceURLAsync])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 500)
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return (
    <CastLayout>
      <Container>
        <audio
          muted={isMuted}
          onEnded={handleEndAudio}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleUpdateTime}
          ref={audioRef} />
        <IndicatorSection>
          <Clock isActive={isActive}>
            <ClockDate>{now.toLocaleDateString()}</ClockDate>
            <ClockTime>{now.toLocaleTimeString()}</ClockTime>
          </Clock>
          <Indicators>
            <Indicator>
              <IndicatorStatusIcon isActive={!isMuted} />
              <IndicatorText>{isMuted ? 'ミュート中' : 'ミュート解除中'}</IndicatorText>
            </Indicator>
            <Indicator>
              <IndicatorStatusIcon isActive={!!playingSource} />
              <IndicatorText>音源: {playingSource?.name ?? '-'}</IndicatorText>
            </Indicator>
            <Indicator>
              <IndicatorStatusIcon isActive={!!playingSource} />
              <IndicatorText>再生位置: {formatSeconds(currentTime)}/{formatSeconds(duration)}</IndicatorText>
            </Indicator>
            <Indicator>
              <IndicatorStatusIcon isActive={!!folderKey} />
              <IndicatorText>フォルダ: {folderKey}</IndicatorText>
            </Indicator>
            <Indicator>
              <IndicatorStatusIcon isActive={connectionStatus === 'open'} />
              <IndicatorText>
                フォルダ同期: {
                  connectionStatus === 'open'
                    ? '同期完了'
                    : connectionStatus === 'connecting'
                      ? '同期処理中'
                      : '未同期'
                } (端末数: {connectionCount})
              </IndicatorText>
            </Indicator>
          </Indicators>
          <ControlArea>
            <ControlButton onClick={() => setIsMuted(m => !m)}>
              <IconLabel
                icon={isMuted ? <SpeakerSimpleHighIcon weight="regular" /> : <SpeakerSimpleSlashIcon weight="regular" />}
                label={`ミュート${isMuted ? 'を解除する' : 'する'}`} />
            </ControlButton>
            <ControlButton onClick={stopAudio}>
              <IconLabel
                icon={<StopIcon />}
                label="再生中の音源を停止する" />
            </ControlButton>
          </ControlArea>
          <ControlArea>
            <ControlButton onClick={() => handleRefresh()}>
              <IconLabel
                icon={<ArrowClockwiseIcon />}
                label="最新の情報に更新する" />
            </ControlButton>
          </ControlArea>
          <ControlArea>
            <LinkButton to="/">
              <IconLabel
                icon={<ArrowLeftIcon />}
                label="フォルダ選択に戻る" />
            </LinkButton>
          </ControlArea>
        </IndicatorSection>

        <DashboardSection>
          <h2>放送スケジュール</h2>

          <details>
            <summary>スケジュール追加</summary>
            <FormSection>
              <FormItem>
                <FormLabel>放送開始時刻</FormLabel>
                <FormInput
                  onChange={e => setEditableSchedule(s => ({ ...s, scheduledAt: e.target.value }))}
                  placeholder="Scheduled Time"
                  type="datetime-local"
                  value={editableSchedule.scheduledAt} />
              </FormItem>
              <FormItem>
                <FormLabel>音源</FormLabel>
                <FormSelect
                  onChange={e => setEditableSchedule(s => ({ ...s, sourceId: Number(e.target.value) }))}
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
                </FormSelect>
              </FormItem>
            </FormSection>
            <FormSection>
              <FormItem>
                <FormButton onClick={handleAddSchedule}>
                  スケジュール追加
                </FormButton>
              </FormItem>
            </FormSection>
          </details>

          {schedules === undefined && (
            <p>
              読み込み中です…
            </p>
          )}
          {schedules && schedules.length === 0 && (
            <p>
              スケジュールがありません
            </p>
          )}
          {schedules && schedules.length > 0 && (
            <ScheduleTable>
              {schedules.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()).map(s => (
                <ScheduleRow key={s.id}>
                  <ScheduleRowHeader>
                    <ScheduleRowIndicatorLabel isActive={s.id === nextScheduleId}>
                      {
                        s.id === nextScheduleId
                          ? '次に放送'
                          : s.scheduledAt < now
                            ? '放送済み'
                            : 'スケジュール済み'
                      }
                    </ScheduleRowIndicatorLabel>
                    <ScheduleRowDateTime>
                      <ScheduleRowDate>{s.scheduledAt.toLocaleDateString()}</ScheduleRowDate>
                      <ScheduleRowTime>{s.scheduledAt.toLocaleTimeString()}</ScheduleRowTime>
                    </ScheduleRowDateTime>
                  </ScheduleRowHeader>
                  <ScheduleRowBody>
                    <ScheduleRowSourceName>{sources?.find(source => source.id === s.sourceId)?.name ?? '-'}</ScheduleRowSourceName>
                    <ScheduleRowActions>
                      <ActionButton onClick={() => handleDeleteSchedule(s.id)}>
                        <TrashIcon weight="fill" />
                      </ActionButton>
                    </ScheduleRowActions>
                  </ScheduleRowBody>
                </ScheduleRow>
              ))}
            </ScheduleTable>
          )}

          <h2>音源管理</h2>

          <details>
            <summary>音源追加</summary>
            <FormSection>
              <FormItem>
                <FormLabel>音源ファイル</FormLabel>
                <FormInput
                  accept="audio/mp3"
                  onChange={e => setFile(e.target.files?.[0])}
                  type="file" />
              </FormItem>
              <FormItem>
                <FormLabel>音源名</FormLabel>
                <FormInput
                  onChange={e => setSourceName(e.target.value)}
                  placeholder="音源名"
                  type="text"
                  value={sourceName} />
              </FormItem>
            </FormSection>
            <FormSection>
              <FormItem>
                <FormButton onClick={handleAddSource}>
                  音源追加
                </FormButton>
              </FormItem>
            </FormSection>
          </details>

          {sources === undefined && (
            <p>読み込み中です…</p>
          )}

          {sources && sources.length === 0 && (
            <p>音源が登録されていません</p>
          )}

          {sources && sources.length > 0 && (
            <SourceTable>
              {sources?.sort((a, b) => a.name.localeCompare(b.name))
                .map(source => (
                  <SourceRow key={source.id}>
                    <SourceRowIndicator>
                      <SourceRowNowPlaying isActive={playingSource?.id === source.id} />
                    </SourceRowIndicator>
                    <SourceRowTitle>
                      {source.name}
                    </SourceRowTitle>
                    <ActionButton
                      disabled={isMuted}
                      onClick={() => handleManualPlay(source.id)}>
                      <PlayIcon weight="fill" />
                    </ActionButton>
                    <ActionButton onClick={() => handleDeleteSource(source.id)}>
                      <TrashIcon weight="fill" />
                    </ActionButton>
                  </SourceRow>
                ))}
            </SourceTable>
          )}
        </DashboardSection>
      </Container>
    </CastLayout>
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
const Clock = styled.div<{ isActive: boolean | null }>`
  padding: 20px;
  text-align: center;
  background-color: ${props =>
    props.isActive === null
      ? 'var(--panel-background-color)'
      : props.isActive
        ? 'var(--panel-active-background-color)'
        : 'var(--panel-inactive-background-color)'};
   ${props => props.isActive && 'box-shadow: 0 0 10px var(--indicator-active-color)'};
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
  transition: background-color 0.5s, box-shadow 0.5s;
`
const ClockDate = styled.div`
  font-size: 1.2em;
  text-align: center;
`
const ClockTime = styled.div`
  font-size: 3em;
  font-weight: bold;
`
const Indicators = styled.div``
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
    transition: background-color 0.5s, box-shadow 0.5s;
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
  ${buttonStyle}
`
const LinkButton = styled(Link)`
  ${buttonStyle}
  text-decoration: none;
`
const ActionButton = styled(ControlButton)`
  display: inline-block;
  height: 100%;
  svg {
    width: 18px;
    height: 18px;
    color: var(--button-text-color);
  }
  &:disabled {
    svg {
      color: var(--disabled-text-color) !important;
    }
  }
`
const ScheduleTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`
const ScheduleRow = styled.div`
  display: grid;
  grid-template-columns: 128px 1fr;
  gap: 10px;
  background-color: var(--card-background-color);
  padding: 10px;
  border-radius: 10px;
`
const ScheduleRowHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`
const ScheduleRowIndicatorLabel = styled.div<{ isActive?: boolean }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
  background-color: ${props => props.isActive ? 'var(--label-active-color)' : 'var(--disabled-background-color)'};
  color: var(--indicator-text-color);
  text-align: center;
`
const ScheduleRowBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 64px;
  align-items: center;
`
const ScheduleRowDateTime = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
`
const ScheduleRowDate = styled.span`
  font-size: 0.75em;
`
const ScheduleRowTime = styled.span``
const ScheduleRowSourceName = styled.div`
  font-size: 1.2em;
`
const ScheduleRowActions = styled.div`
  height: 100%;
`
const SourceTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`
const SourceRow = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 64px 64px;
  gap: 5px;
  background-color: var(--card-background-color);
  padding: 10px;
  border-radius: 10px;
`
const SourceRowIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`
const SourceRowNowPlaying = styled.span<{ isActive?: boolean }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: background-color 0.5s, box-shadow 0.5s;
  background-color: ${props => props.isActive ? 'var(--indicator-active-color)' : 'var(--indicator-inactive-color)'};
  box-shadow: 0 0 10px ${props => props.isActive ? 'var(--indicator-active-color)' : 'var(--indicator-inactive-color)'};
`
const SourceRowTitle = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.2em;
`
