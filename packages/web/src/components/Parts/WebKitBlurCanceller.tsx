import styled from '@emotion/styled'

const WebKitBlurCanceller = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 11px;
  z-index: 2147483647;
  pointer-events: none;
  background-color: #202020;
  -webkit-background-clip: text;
  background-clip: text;
`

export default WebKitBlurCanceller
