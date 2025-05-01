import React, { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import useFirebase from '../../hooks/useFirebase'

// 型定義
interface UploadedFile {
  id: string;
  name: string;
  url: string;
  scheduledTime: string | null;
}

interface Schedule {
  fileId: string;
  scheduledTime: string;
  timerId: NodeJS.Timeout;
}

const App: React.FC = () => {
  const { getFirestore, getStorage } = useFirebase()
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])

  const firestore = getFirestore()
  const storage = getStorage()

  const uploadedFilesCollection = collection(firestore, 'uploadedFiles')

  // useEffect(() => {
  //   // Firestoreから保存済みのファイルを取得
  //   const fetchUploadedFiles = async () => {
  //     const snapshot = await getDocs(uploadedFilesCollection)
  //     const filesData: UploadedFile[] = snapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...(doc.data() as DocumentData)
  //     }))
  //     setUploadedFiles(filesData)

  //     // スケジュールが設定されているファイルを再スケジュール
  //     filesData.forEach(file => {
  //       if (file.scheduledTime) {
  //         const now = new Date()
  //         const targetTime = new Date(file.scheduledTime)

  //         if (targetTime > now) {
  //           const delay = targetTime.getTime() - now.getTime()
  //           const timerId = setTimeout(() => {
  //             const audio = new Audio(file.url)
  //             audio.play().catch(err => console.error('再生に失敗:', err))
  //           }, delay)

  //           setSchedules(prev => [
  //             ...prev,
  //             { fileId: file.id, scheduledTime: file.scheduledTime!, timerId }
  //           ])
  //         }
  //       }
  //     })
  //   }
  //   fetchUploadedFiles()
  // }, [])

  // ファイル選択のハンドラ
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files))
    }
  }

  // Firebase Storageにファイルをアップロードし、Firestoreに保存
  const handleFileUpload = async () => {
    if (files.length === 0) {
      alert('ファイルを選択してください！')
      return
    }

    for (const file of files) {
      const storageRef = ref(storage, `audio/${file.name}`)
      try {
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)

        // Firestoreにファイル情報を保存
        const docRef = await addDoc(uploadedFilesCollection, {
          name: file.name,
          url,
          scheduledTime: null
        })

        setUploadedFiles(prev => [
          ...prev,
          { id: docRef.id, name: file.name, url, scheduledTime: null }
        ])
      }
      catch (error) {
        console.error(`アップロードに失敗しました (${file.name}):`, error)
      }
    }
    alert('アップロードが完了しました！')
  }

  // 再生スケジュールを設定
  const schedulePlayback = async (fileId: string, scheduledTime: string) => {
    if (!scheduledTime) {
      alert('再生時間を設定してください！')
      return
    }

    const now = new Date()
    const targetTime = new Date(scheduledTime)

    if (targetTime <= now) {
      alert('未来の時間を設定してください！')
      return
    }

    const delay = targetTime.getTime() - now.getTime()

    const timerId = setTimeout(() => {
      const file = uploadedFiles.find(file => file.id === fileId)
      if (file) {
        const audio = new Audio(file.url)
        audio.play().catch(err => console.error('再生に失敗:', err))
      }
    }, delay)

    // Firestoreでスケジュール時間を更新
    const fileDoc = doc(firestore, 'uploadedFiles', fileId)
    await updateDoc(fileDoc, { scheduledTime })

    setSchedules(prev => [
      ...prev,
      { fileId, scheduledTime, timerId }
    ])

    alert('再生スケジュールを設定しました！')
  }

  // スケジュールのキャンセル
  const cancelSchedule = async (fileId: string) => {
    const scheduleToCancel = schedules.find(
      schedule => schedule.fileId === fileId
    )

    if (scheduleToCancel) {
      clearTimeout(scheduleToCancel.timerId)

      setSchedules(prevSchedules =>
        prevSchedules.filter(schedule => schedule.fileId !== fileId)
      )

      // Firestoreでスケジュール時間をリセット
      const fileDoc = doc(firestore, 'uploadedFiles', fileId)
      await updateDoc(fileDoc, { scheduledTime: null })

      alert('スケジュールをキャンセルしました！')
    }
  }

  // ファイルを削除
  const deleteFile = async (fileId: string) => {
    const fileToDelete = uploadedFiles.find(file => file.id === fileId)
    if (fileToDelete) {
      // Firestoreから削除
      const fileDoc = doc(firestore, 'uploadedFiles', fileId)
      await deleteDoc(fileDoc)

      // ローカル状態を更新
      setUploadedFiles(prev =>
        prev.filter(file => file.id !== fileId)
      )

      alert('ファイルを削除しました！')
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>複数音声ファイル再生アプリケーション</h1>

      <div>
        <input type="file" />
        {/* // accept="audio/*"
          // multiple
          // onChange={handleFileChange} */}

        <button onClick={handleFileUpload}>アップロード</button>
      </div>

      <h2>アップロード済みファイル</h2>
      {uploadedFiles.length === 0
        ? (
          <p>ファイルがアップロードされていません。</p>
        )
        : (
          <ul>
            {uploadedFiles.map(file => (
              <li key={file.id}>
                <p>ファイル名: {file.name}</p>
                <a
                  href={file.url}
                  rel="noopener noreferrer"
                  target="_blank">
                  再生リンク
                </a>
                <div>
                  <label>
                    再生時間を設定:
                    <input
                      onChange={e =>
                        schedulePlayback(file.id, e.target.value)}
                      type="datetime-local" />
                  </label>
                  <button onClick={() => cancelSchedule(file.id)}>
                    キャンセル
                  </button>
                  <button onClick={() => deleteFile(file.id)}>削除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}

export default App
