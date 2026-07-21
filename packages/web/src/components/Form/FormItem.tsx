import styled from '@emotion/styled'

const FormItem = styled.div<{ $inlined?: boolean }>`
  margin-bottom: 10px;
  &:last-child {
    margin-bottom: 0;
  }

  ${props => props.$inlined && `
    display: flex;
    gap: 10px;
  `}
`

export default FormItem
