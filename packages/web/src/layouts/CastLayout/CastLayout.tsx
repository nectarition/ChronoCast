import RequiredLogin from '../../libs/RequiredLogin'

interface Props {
  children: React.ReactNode
  allowAnonymous?: boolean
  allowInactive?: boolean
}
const CastLayout: React.FC<Props> = props => {
  return (
    <RequiredLogin
      allowAnonymous={props.allowAnonymous}
      allowInactive={props.allowInactive}>
      {props.children}
    </RequiredLogin>
  )
}

export default CastLayout
