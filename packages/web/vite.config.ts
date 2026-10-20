import fs from 'fs'
import react from '@vitejs/plugin-react-swc'
import { UserConfig } from 'vite'

// https://vite.dev/config/
export default ({ mode }: { mode: string }): UserConfig => ({
  plugins: [react()],
  server: {
    ...mode !== 'production' && ({
      https: {
        key: fs.readFileSync('../../certs/localhost-key.pem'),
        cert: fs.readFileSync('../../certs/localhost.pem')
      }
    })
  }
})
