import styled from '@emotion/styled'
import inputStyle from '../mixins/inputStyle'

const FormTextarea = styled.textarea`
  ${inputStyle}
  resize: vertical;
  min-height: 20em;
`

export default FormTextarea
