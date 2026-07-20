import styled from '@emotion/styled'
import RequiredLogin from '../../libs/RequiredLogin'

interface Props {
  children: React.ReactNode
  allowAnonymous?: boolean
  allowInactive?: boolean
}
const DefaultLayout: React.FC<Props> = props => {
  return (
    <RequiredLogin
      allowAnonymous={props.allowAnonymous}
      allowInactive={props.allowInactive}>
      <Container>
        {props.children}
      </Container>
    </RequiredLogin>
  )
}

export default DefaultLayout

const Container = styled.div`
  padding: 20px 10%;
  @media screen and (max-width: 768px) {
    padding: 20px;
  }
`
