import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAccount from '../hooks/useAccount'

export type RedirectAfterLogin = {
  pathname: string
  state?: object
}

interface Props {
  children: React.ReactNode
  allowAnonymous: boolean | undefined
  allowInactive: boolean | undefined
  redirectAfterLogin?: RedirectAfterLogin
}
const RequiredLogin: React.FC<Props> = props => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAccount()

  useEffect(() => {
    if (user === undefined) return
    if (props.allowAnonymous && user === null) return
    if (props.allowInactive && !user?.isActive) return
    if (user && (location.pathname === '/login' || location.pathname === '/oidc/callback')) {
      if (location.state?.from) {
        const fromLocation = location.state.from as { pathname: string; search: string }
        navigate(`${fromLocation.pathname}${fromLocation.search}`, { replace: true })
      }
      else if (props.redirectAfterLogin) {
        navigate(props.redirectAfterLogin.pathname, { replace: true, state: props.redirectAfterLogin.state })
      }
      else {
        navigate('/', { replace: true })
      }
      return
    }
    if (!user?.isActive && !props.allowInactive) {
      navigate('/login', {
        state: { from: (location.pathname !== '/' && location) || undefined },
        replace: true
      })
      return
    }
    if (user !== null) return
    navigate('/login', {
      state: { from: (location.pathname !== '/' && location) || undefined },
      replace: true
    })
  }, [user, location, props.redirectAfterLogin, props.allowAnonymous, props.allowInactive])

  return (
    <>
      {(user?.isActive || props.allowAnonymous || props.allowInactive) && props.children}
    </>
  )
}

export default RequiredLogin
