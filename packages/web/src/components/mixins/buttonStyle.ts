import { css, type SerializedStyles } from '@emotion/react'

type ColorType =  'danger' | 'default'
type Props = {
  size?: 'small' | 'large'
  color?: ColorType
  inlined?: boolean
  disabled?: boolean
}
const buttonStyle = (props: Props): SerializedStyles => css`
  display: block;
  width: 100%;
  padding: 10px;

  ${props.inlined && ({
    display: 'inline-block',
    width: 'auto',
    padding: '10px 20px'
  })}


  font-family: inherit;
  font-weight: inherit;
  font-size: inherit;

  text-align: center;
  text-decoration: none;
  
  border: 1px solid var(--border-color);
  background-color: var(--inputfield-background-color);
  color: inherit;
  border-radius: 5px;

  cursor: pointer;

  transition: border 0.2s, background-color 0.2s;

  &:disabled {
    background-color: var(--disabled-background-color);
    color: var(--disabled-text-color);
    border-bottom: 1px solid var(--border-color);
    cursor: unset;
    pointer-events: none;
  }

  ${props.disabled && (`
    background-color: var(--disabled-background-color);
    color: var(--disabled-text-color);
    border-bottom: 1px solid var(--border-color);
    cursor: unset;
    pointer-events: none;
  `)}

  ${props.size === 'small' && (`
    width: auto;
    padding: 5px 10px;
    font-size: 0.9em;
  `)}

  ${props.size === 'large' && (`
    font-size: 1.75em;
    font-weight: bold;
  `)}
  
  &:hover {
    border: 1px solid var(--button-text-color);
  }

  &:active {
    background-color: var(--brand-background-active-color);
  }
`

export default buttonStyle
