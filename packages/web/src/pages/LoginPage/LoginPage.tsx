import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useFirebase from '../../hooks/useFirebase'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { loginByEmailAsync } = useFirebase()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [folderId, setFolderId] = useState('')

  const handleLogin = useCallback(async () => {
    if (!folderId) return
    loginByEmailAsync(email, password)
      .then(() => {
        navigate(`/cast/${folderId}`)
      })
      .catch(err => {
        alert('Login failed')
        throw err
      })
  }, [email, password, folderId])

  return (
    <>
      <h1>ログイン</h1>
      <input
        onChange={e => setEmail(e.target.value)}
        placeholder="メールアドレス"
        type="email"
        value={email} />
      <input
        onChange={e => setPassword(e.target.value)}
        placeholder="パスワード"
        type="password"
        value={password} />
      <input
        onChange={e => setFolderId(e.target.value)}
        placeholder="フォルダ"
        value={folderId} />
      <button onClick={handleLogin}>Login</button>
    </>
  )
}

export default LoginPage
