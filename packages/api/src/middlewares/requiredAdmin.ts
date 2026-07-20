import { Next } from 'hono'
import { APIContext } from '../@types'
import APIError from '../libs/APIError'

const requiredAdmin = async (c: APIContext, next: Next) => {
  const user = c.get('user')
  const prisma = c.get('prisma')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true }
  })

  if (!dbUser?.isAdmin) {
    throw new APIError('forbidden', 'forbidden', 'Forbidden')
  }

  return await next()
}

export default requiredAdmin
