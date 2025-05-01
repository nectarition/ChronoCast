import { useCallback, useState } from 'react'
import useFirebase from '../../hooks/useFirebase'

const LoginPage: React.FC = () => {
  const { loginByEmailAsync } = useFirebase()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = useCallback(async () => {
    loginByEmailAsync(email, password)
      .then(() => {
        alert('Login successful')
      })
      .catch(err => {
        console.error('Login failed:', err)
        alert('Login failed')
      })
  }, [email, password])

  return (
    <>
      <h1>Login</h1>
      <input
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        value={email} />
      <input
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        value={password} />
      <button onClick={handleLogin}>Login</button>
    </>
  )
}

export default LoginPage
