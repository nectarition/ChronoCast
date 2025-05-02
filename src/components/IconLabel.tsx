import styled from '@emotion/styled'

interface Props {
  icon: React.ReactNode;
  label: string;
}
const IconLabel: React.FC<Props> = props => {
  return (
    <Container>
      <Icon>
        {props.icon}
      </Icon>
      <Label>
        {props.label}
      </Label>
    </Container>
  )
}

export default IconLabel

const Container = styled.div`
  width: auto;
  display: flex;
  gap: 0.5em;
  justify-content: center;
  align-items: center;
`
const Icon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 1.5em;
    height: 1.5em;
  }
`
const Label = styled.div`
  
`
