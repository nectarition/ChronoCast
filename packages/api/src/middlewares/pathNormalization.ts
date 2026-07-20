import { MiddlewareHandler } from 'hono/types'
import { APIEnv } from '../@types'

export const pathNormalization: MiddlewareHandler<APIEnv> = async (c, next) => {
  const url = new URL(c.req.url)

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
    return c.redirect(url.toString(), 301)
  }

  await next()
}
