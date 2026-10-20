import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import useAccount from '../hooks/useAccount'

interface Props {
  children: React.ReactNode
}
const AuthenticationProvider: React.FC<Props> = props => {
  const { user, loginDirectlyAsync } = useAccount()
  const location = useLocation()

  useEffect(() => {
    if (user !== undefined) return
    if (location.pathname === '/oidc/callback') return
    const abort = new AbortController()
    loginDirectlyAsync(abort)
      .catch(err => {
        if (err.name !== 'APIError') return
        throw err
      })
    return () => abort.abort()
  }, [user, location.pathname, loginDirectlyAsync])

  return (
    <>
      {props.children}
    </>
  )
}

export default AuthenticationProvider
