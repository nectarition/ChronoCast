import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LinkButton from '../../components/Parts/LinkButton'
import useNectaritionID from '../../hooks/useNectaritionID'
import RequiredLogin from '../../libs/RequiredLogin'

const OIDCCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const { processCallbackAsync } = useNectaritionID()

  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const [requestError, setRequestError] = useState<string>()

  useEffect(() => {
    if (error) {
      const errorMessage = error === 'access_denied' ? 'ログインがキャンセルされました。' : error
      setRequestError(`OIDC エラー: ${errorMessage}`)
      return
    }
    if (!code || !state) return
    const abort = new AbortController()
    processCallbackAsync(code, state, abort)
      .then(() => {
        navigate('/', { replace: true })
      })
      .catch(err => {
        if (err.code === 'ERR_CANCELED') return
        console.error(err)
        setRequestError(err.message || 'Unknown error')
      })
    return () => abort.abort()
  }, [error, code, state])

  return (
    <RequiredLogin
      allowAnonymous={true}
      allowInactive={true}>
      {requestError
        ? (
          <>
            エラーが発生しました: {requestError}<br />
            <LinkButton to="/login">ログイン画面に戻る</LinkButton>
          </>
        )
        : (
          <>
            ログイン処理中...
          </>
        )}
    </RequiredLogin>
  )
}

export default OIDCCallbackPage
