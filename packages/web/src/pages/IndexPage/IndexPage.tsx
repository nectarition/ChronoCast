import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon, SignOutIcon } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import FormButton from '../../components/Form/FormButton'
import FormInput from '../../components/Form/FormInput'
import FormItem from '../../components/Form/FormItem'
import FormLabel from '../../components/Form/FormLabel'
import FormSection from '../../components/Form/FormSection'
import IconLabel from '../../components/Parts/IconLabel'
import LinkButton from '../../components/Parts/LinkButton'
import useAccount from '../../hooks/useAccount'
import useCast from '../../hooks/useCast'
import DefaultLayout from '../../layouts/DefaultLayout/DefaultLayout'

const IndexPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logoutAsync } = useAccount()
  const { getFolderByKeyAsync } = useCast()

  const [folderKey, setFolderKey] = useState('')
  const [isProgress, setIsProgress] = useState(false)

  const handleFetch = useCallback(async () => {
    if (folderKey.trim() === '') return
    setIsProgress(true)
    getFolderByKeyAsync(folderKey, new AbortController())
      .then(() => {
        navigate(`/folders/${folderKey}`)
      })
      .catch(err => {
        if (err.name !== 'APIError') return
        toast.error(err.message)
        setIsProgress(false)
      })
  }, [getFolderByKeyAsync, navigate, folderKey])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && folderKey.trim() !== '') {
      handleFetch()
    }
  }, [folderKey, handleFetch])

  const handleLogout = useCallback(() => {
    logoutAsync()
      .then(() => navigate('/login', { replace: true }))
  }, [navigate, logoutAsync])

  return (
    <DefaultLayout allowInactive>
      <h1>ChronoCast</h1>
      {user?.isActive && (
        <>
          <FormSection>
            <FormItem>
              <FormLabel>フォルダキーを入力してください</FormLabel>
              <FormInput
                onChange={e => setFolderKey(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="フォルダキー"
                value={folderKey} />
            </FormItem>
          </FormSection>
          <FormSection>
            <FormItem>
              <LinkButton
                disabled={folderKey.trim() === '' || isProgress}
                to={`/folders/${folderKey}`}>
                <IconLabel
                  icon={<ArrowRightIcon />}
                  label="フォルダに移動" />
              </LinkButton>
            </FormItem>
          </FormSection>
        </>
      )}
      {!user?.isActive && (
        <p>
          アカウントがロックされています。管理者にお問い合わせください。
        </p>
      )}
      <p>
        ログイン中のユーザ: {user?.email}
      </p>
      <FormSection>
        <FormItem>
          <FormButton onClick={handleLogout}>
            <IconLabel
              icon={<SignOutIcon />}
              label="ログアウト" />
          </FormButton>
        </FormItem>
      </FormSection>
    </DefaultLayout>
  )
}

export default IndexPage
