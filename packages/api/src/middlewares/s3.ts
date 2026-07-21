import { S3Client } from '@aws-sdk/client-s3'
import type { APIContext } from '../@types'
import type { Next } from 'hono'

const s3 = async (c: APIContext, next: Next) => {
  if (!c.get('s3')) {
    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${c.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: c.env.S3_ACCESS_KEY_ID,
        secretAccessKey: c.env.S3_SECRET_ACCESS_KEY
      }
    })
    c.set('s3', S3)
  }
  await next()
}

export default s3
