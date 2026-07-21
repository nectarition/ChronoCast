import { APIContext } from '../@types'
import { $Enums } from '../generated/prisma'
import APIError from './APIError'

const assertRoleAsync = async (c: APIContext, role: $Enums.UserRoleTypes) => {
  const user = c.get('user')
  const prisma = c.get('prisma')
  
  const fetchedUser = await prisma.user.findUnique({
    where: {
      id: user.id
    }
  })

  if (!fetchedUser) {
    throw new APIError('not-found', 'not-found', 'User not found')
  } else if (fetchedUser.role !== role) {
    throw new APIError('invalid-operation', 'invalid-operation', 'You are not allowed to perform this operation')
  }
}

export default assertRoleAsync
