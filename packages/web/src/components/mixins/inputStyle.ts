import { css } from '@emotion/react'

const inputStyle = css`
  display: block;
  font-family: inherit;
  font-weight: inherit;

  width: 100%;
  padding: 10px;
  outline: none;
  border: 1px solid var(--border-color);
  background-color: var(--inputfield-background-color);
  color: var(--text-color);
  font-size: 16px;

  transition: border 0.2s;

  &:focus {
    border: 1px solid var(--text-color);
  }

  border-radius: 5px;
  
  &:disabled {
    background-color: #c8c8c8;
    color: #808080;
    border-bottom: 2px solid #c0c0c0;
    cursor: unset;
  }
`

export default inputStyle
