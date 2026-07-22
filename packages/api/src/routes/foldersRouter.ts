import { Folder, Schedule, Source } from 'chronocast'
import { Hono } from 'hono'
import { APIEnv, APIContext } from '../@types'
import { errorCodes } from '../constants/errorCodes'
import jwtHelper from '../helpers/jwtHelper'
import APIError from '../libs/APIError'
import requiredLogin from '../middlewares/requiredLogin'
import s3Service from '../services/s3Service'

const getFolderSchedulerStub = (c: APIContext, folderKey: string) => {
  const id = c.env.FOLDER_DO.idFromName(folderKey)
  return c.env.FOLDER_DO.get(id)
}

const router = new Hono<APIEnv>()

router.get('/folders/:folderKey', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  const prisma = c.get('prisma')

  const folder = await prisma.folder.findUnique({
    where: {
      slug: folderKey
    }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const result: Folder = {
    key: folder.slug
  }

  return c.json(result)
})

router.get('/folders/:folderKey/sources', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  const prisma = c.get('prisma')

  const folder = await prisma.folder
    .findUnique({
      where: {
        slug: folderKey
      },
      include: {
        sources: true
      }
    })
  if (!folder) {
    throw APIError.notFound()
  }

  const results: Source[] = folder.sources.map(s => ({
    id: s.id,
    folderKey: folder.slug,
    name: s.name
  }))

  return c.json(results)
})

router.post('/folders/:folderKey/sources', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  const body = await c.req.json()
  const { name } = body
  if (!name) {
    throw APIError.invalidArgument('name is required')
  }

  const prisma = c.get('prisma')

  const folder = await prisma.folder.findUnique({
    where: {
      slug: folderKey
    }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const source = await prisma.source.create({
    data: {
      name,
      folderId: folder.id
    }
  })

  return c.json({ id: source.id })
})

router.patch('/folders/:folderKey/sources/:sourceId', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')

  const sourceId = Number(c.req.param('sourceId'))
  if (isNaN(sourceId)) {
    throw APIError.invalidArgument('sourceId is invalid')
  }

  const body = await c.req.json()
  const { name } = body
  if (!name) {
    throw APIError.invalidArgument('name is required')
  }

  const prisma = c.get('prisma')

  const folder = await prisma.folder.findUnique({
    where: { slug: folderKey }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const source = await prisma.source.findUnique({
    where: {
      id: sourceId
    }
  })
  if (!source || source.folderId !== folder.id) {
    throw APIError.notFound()
  }

  await prisma.source.update({
    where: { id: sourceId },
    data: { name }
  })

  const folderDO = getFolderSchedulerStub(c, folder.slug)
  await folderDO.broadcastUpdateSource({
    id: source.id,
    folderKey: folder.slug,
    name
  })

  return c.json({ success: true })
})

router.post('/folders/:folderKey/sources/:sourceId/file', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  if (!folderKey) {
    throw APIError.invalidArgument('folderKey is required')
  }

  const sourceId = Number(c.req.param('sourceId'))
  if (isNaN(sourceId)) {
    throw APIError.invalidArgument('sourceId is invalid')
  }

  const prisma = c.get('prisma')

  const folder = await prisma.folder.findUnique({
    where: {
      slug: folderKey
    }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const source = await prisma.source.findUnique({
    where: {
      id: sourceId
    }
  })
  if (!source || source.folderId !== folder.id) {
    throw APIError.notFound()
  }

  const body = await c.req.parseBody()
  const file = body['file']

  if (!file || typeof file !== 'object' || !('stream' in file)) {
    throw APIError.invalidArgument('Invalid file upload')
  }

  await s3Service.uploadFileAsync(c, `sources/${folderKey}/${sourceId}`, file)

  const folderDO = getFolderSchedulerStub(c, folderKey)
  await folderDO.broadcastAddSource({
    id: source.id,
    folderKey: folder.slug,
    name: source.name
  })

  return c.json({ success: true })
})

router.post('/folders/:folderKey/sources/:sourceId/broadcast', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  if (!folderKey) {
    throw APIError.invalidArgument('folderKey is required')
  }

  const sourceId = Number(c.req.param('sourceId'))
  if (isNaN(sourceId)) {
    throw APIError.invalidArgument('sourceId is invalid')
  }

  const prisma = c.get('prisma')

  const folder = await prisma.folder.findUnique({
    where: {
      slug: folderKey
    }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const source = await prisma.source.findUnique({
    where: {
      id: sourceId
    }
  })
  if (!source || source.folderId !== folder.id) {
    throw APIError.notFound()
  }

  const folderDO = getFolderSchedulerStub(c, folderKey)
  await folderDO.broadcastPlaySource(sourceId)

  return c.json({ success: true })
})

router.delete('/folders/:folderKey/sources/:sourceId', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  if (!folderKey) {
    throw APIError.invalidArgument('folderKey is required')
  }

  const sourceId = Number(c.req.param('sourceId'))
  if (isNaN(sourceId)) {
    throw APIError.invalidArgument('sourceId is invalid')
  }

  const prisma = c.get('prisma')

  const folder = await prisma.folder.findUnique({
    where: {
      slug: folderKey
    }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const source = await prisma.source.findUnique({
    where: {
      id: sourceId
    }
  })
  if (!source || source.folderId !== folder.id) {
    throw APIError.notFound()
  }

  await s3Service.deleteFileAsync(c, `sources/${folderKey}/${sourceId}`)

  await prisma.source.delete({
    where: {
      id: sourceId
    }
  })

  const folderDO = getFolderSchedulerStub(c, folderKey)
  await folderDO.broadcastRemoveSource(sourceId)

  return c.json({ success: true })
})

router.get('/folders/:folderKey/sources/:sourceId/url', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  const sourceId = Number(c.req.param('sourceId'))
  if (isNaN(sourceId)) {
    throw APIError.invalidArgument('sourceId is invalid')
  }

  const prisma = c.get('prisma')

  const folder = await prisma.folder.findUnique({
    where: {
      slug: folderKey
    }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const source = await prisma.source.findUnique({
    where: {
      id: sourceId
    }
  })
  if (!source || source.folderId !== folder.id) {
    throw APIError.notFound()
  }

  const url = await s3Service.getPresignedUrlAsync(c, `sources/${folderKey}/${sourceId}`)
  if (!url) {
    throw APIError.notFound()
  }

  return c.json({ url })
})

router.get('/folders/:folderKey/schedules', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  const prisma = c.get('prisma')

  const folder = await prisma.folder
    .findUnique({
      where: {
        slug: folderKey
      },
      include: {
        schedules: true
      }
    })
  if (!folder) {
    throw APIError.notFound()
  }

  const results = folder.schedules.map(s => ({
    id: s.id,
    sourceId: s.sourceId,
    folderId: s.folderId,
    scheduledAt: s.scheduledAt
  }))

  return c.json(results)
})

router.post('/folders/:folderKey/schedules', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  if (!folderKey) {
    throw APIError.invalidArgument('folderKey is required')
  }

  const body = await c.req.json()
  const { sourceId, scheduledAt } = body
  if (!sourceId || !scheduledAt) {
    throw APIError.invalidArgument('sourceId and scheduledAt are required')
  }

  const prisma = c.get('prisma')

  const folder = await prisma.folder.findUnique({
    where: {
      slug: folderKey
    }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const source = await prisma.source.findUnique({
    where: {
      id: sourceId
    }
  })
  if (!source || source.folderId !== folder.id) {
    throw APIError.notFound()
  }

  const existingSchedule = await prisma.schedule.findFirst({
    where: {
      sourceId,
      folderId: folder.id,
      scheduledAt: new Date(scheduledAt)
    }
  })
  if (existingSchedule) {
    throw APIError.invalidOperation()
  }

  const schedule = await prisma.schedule.create({
    data: {
      sourceId,
      folderId: folder.id,
      scheduledAt: new Date(scheduledAt)
    }
  })

  const scheduler = getFolderSchedulerStub(c, folderKey)
  await scheduler.addSchedule({
    id: schedule.id,
    sourceId: schedule.sourceId,
    scheduledAt: schedule.scheduledAt.getTime()
  })

  const result: Schedule = {
    id: schedule.id,
    sourceId: schedule.sourceId,
    scheduledAt: schedule.scheduledAt
  }

  return c.json(result)
})

router.delete('/folders/:folderKey/schedules/:scheduleId', requiredLogin, async c => {
  const folderKey = c.req.param('folderKey')
  if (!folderKey) {
    throw APIError.invalidArgument('folderKey is required')
  }

  const scheduleId = Number(c.req.param('scheduleId'))
  if (isNaN(scheduleId)) {
    throw APIError.invalidArgument('scheduleId is invalid')
  }

  const prisma = c.get('prisma')

  const folder = await prisma.folder.findUnique({
    where: {
      slug: folderKey
    }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const schedule = await prisma.schedule.findUnique({
    where: {
      id: scheduleId
    }
  })
  if (!schedule || schedule.folderId !== folder.id) {
    throw APIError.notFound()
  }

  await prisma.schedule.delete({
    where: {
      id: scheduleId
    }
  })

  const scheduler = getFolderSchedulerStub(c, folderKey)
  await scheduler.removeSchedule(scheduleId)

  return c.json({ success: true })
})

router.get('/folders/:folderKey/ws', async c => {
  const folderKey = c.req.param('folderKey')
  const token = c.req.query('token')
  if (!token) {
    throw new APIError(errorCodes.unauthorized)
  }

  const user = await jwtHelper.verifyAPITokenAsync(c, token)
  if (!user) {
    throw new APIError(errorCodes.unauthorized)
  }

  const prisma = c.get('prisma')
  const userRecord = await prisma.user.findUnique({
    where: {
      id: user.id
    }
  })
  if (!userRecord || !userRecord.isActive) {
    throw APIError.forbidden()
  }

  const folder = await prisma.folder.findUnique({
    where: {
      slug: folderKey
    }
  })
  if (!folder) {
    throw APIError.notFound()
  }

  const scheduler = getFolderSchedulerStub(c, folderKey)
  return await scheduler.fetch(c.req.raw)
})

export default router
