import { listLocalDatabases } from '@prisma/adapter-d1'
import { defineConfig } from '@prisma/config'

const localDb =
  process.env.CI || process.env.NODE_ENV === 'production'
    ? undefined
    : listLocalDatabases()[0]

export default defineConfig({
  datasource: {
    url: localDb ? `file:${localDb}` : undefined
  }
})
