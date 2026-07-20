import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useNectaritionID from '../../hooks/useNectaritionID'
import DefaultLayout from '../../layouts/DefaultLayout/DefaultLayout'
import FormSection from '../../components/Form/FormSection'
import FormItem from '../../components/Form/FormItem'
import FormButton from '../../components/Form/FormButton'
import styled from '@emotion/styled'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { getAuthorizeURLAsync } = useNectaritionID()


  const handleLoginWithNectaritionID = useCallback(() => {
    getAuthorizeURLAsync(new AbortController())
      .then(url => {
        window.location.href = url
      })
  }, [getAuthorizeURLAsync])

  return (
    <DefaultLayout allowAnonymous>
      <h1>ChronoCast ログイン</h1>
      <FormSection>
        <FormItem $inlined>
          <FormButton
            inlined
            onClick={handleLoginWithNectaritionID}>
            <LogoImage src="https://id.nectarition.jp/assets/logo/white.png" />
            ねくたりしょん ID でログイン
          </FormButton>
        </FormItem>
      </FormSection>
    </DefaultLayout>
  )
}

export default LoginPage

const LogoImage = styled.img`
  height: 1.25em;
  vertical-align: sub;
  padding-right: 0.5em;

  transition: filter 0.2s;
  
  button:disabled & {
    filter: contrast(0.1)
  }
`
