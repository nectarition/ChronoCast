import RequiredLogin from '../../libs/RequiredLogin'

interface Props {
  children: React.ReactNode
  allowAnonymous?: boolean
}
const DefaultLayout: React.FC<Props> = props => {
  return (
    <RequiredLogin allowAnonymous={props.allowAnonymous}>
      {props.children}
    </RequiredLogin>
  )
}

export default DefaultLayout
