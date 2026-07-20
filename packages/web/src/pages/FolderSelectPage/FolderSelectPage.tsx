import { ArrowRight, SignOut } from "@phosphor-icons/react"
import { useCallback, useState } from "react"
import FormInput from "../../components/Form/FormInput"
import FormItem from "../../components/Form/FormItem"
import FormLabel from "../../components/Form/FormLabel"
import FormSection from "../../components/Form/FormSection"
import IconLabel from "../../components/Parts/IconLabel"
import DefaultLayout from "../../layouts/DefaultLayout/DefaultLayout"
import LinkButton from "../../components/Parts/LinkButton"
import { useNavigate } from "react-router-dom"
import FormButton from "../../components/Form/FormButton"
import useAccount from "../../hooks/useAccount"

const FolderSelectPage: React.FC = () => {
  const navigate = useNavigate()
  const {logoutAsync} = useAccount()

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
      <h1>フォルダキーを入力してください</h1>
      <FormSection>
        <FormItem>
          <FormLabel>フォルダキー</FormLabel>
          <FormInput value={folderKey} onChange={e => setFolderKey(e.target.value)} onKeyDown={handleKeyDown} />
        </FormItem>
      </FormSection>
      <FormSection>
        <FormItem>
          <LinkButton to={`/folders/${folderKey}`} disabled={folderKey.trim() === ''}>
            <IconLabel icon={<ArrowRight />} label="フォルダに移動" />
          </LinkButton>
        </FormItem>
      </FormSection>
      <FormSection>
        <FormItem>
          <FormButton onClick={handleLogout}>
            <IconLabel icon={<SignOut />} label="ログアウト" />
          </FormButton>
        </FormItem>
      </FormSection>
    </DefaultLayout>
  )
}

export default FolderSelectPage
