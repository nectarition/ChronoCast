import { useEffect } from 'react'
import useAccount from '../hooks/useAccount'
import useToken from '../hooks/useToken'

interface Props {
  children: React.ReactNode
}
const AuthenticationProvider: React.FC<Props> = props => {
  const { user, loginDirectlyAsync } = useAccount()
  const { isReady } = useToken()

  useEffect(() => {
    if (user !== undefined || !isReady) return
    const abort = new AbortController()
    loginDirectlyAsync(abort)
      .catch(err => {
        if (err.name !== 'APIError') return
        throw err
      })
    return () => abort.abort()
  }, [isReady, user, loginDirectlyAsync])

  return (
    <>
      {props.children}
    </>
  )
}

export default AuthenticationProvider
