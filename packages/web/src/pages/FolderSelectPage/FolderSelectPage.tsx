import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, SignOut } from '@phosphor-icons/react'
import FormButton from '../../components/Form/FormButton'
import FormInput from '../../components/Form/FormInput'
import FormItem from '../../components/Form/FormItem'
import FormLabel from '../../components/Form/FormLabel'
import FormSection from '../../components/Form/FormSection'
import IconLabel from '../../components/Parts/IconLabel'
import LinkButton from '../../components/Parts/LinkButton'
import useAccount from '../../hooks/useAccount'
import DefaultLayout from '../../layouts/DefaultLayout/DefaultLayout'

const FolderSelectPage: React.FC = () => {
  const navigate = useNavigate()
  const { logoutAsync } = useAccount()

  const [folderKey, setFolderKey] = useState('')

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && folderKey.trim() !== '') {
      navigate(`/folders/${folderKey}`)
    }
  }, [folderKey, navigate])

  const handleLogout = useCallback(() => {
    logoutAsync()
  }, [logoutAsync])

  return (
    <DefaultLayout>
      <h1>ChronoCast</h1>
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
            disabled={folderKey.trim() === ''}
            to={`/folders/${folderKey}`}>
            <IconLabel
              icon={<ArrowRight />}
              label="フォルダに移動" />
          </LinkButton>
        </FormItem>
      </FormSection>
      <FormSection>
        <FormItem>
          <FormButton onClick={handleLogout}>
            <IconLabel
              icon={<SignOut />}
              label="ログアウト" />
          </FormButton>
        </FormItem>
      </FormSection>
    </DefaultLayout>
  )
}

export default FolderSelectPage
