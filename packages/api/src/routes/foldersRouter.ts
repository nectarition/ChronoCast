import { Schedule, Source } from 'chronocast'
import { Hono } from 'hono'
import { APIEnv } from '../@types'
import APIError from '../libs/APIError'
import requiredLogin from '../middlewares/requiredLogin'
import s3Service from '../services/s3Service'

const router = new Hono<APIEnv>()

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

router.post('/folders/:folderKey/sources/:sourceId', requiredLogin, async c => {
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

  const body = await c.req.parseBody()
  const file = body['file']

  if (!file || typeof file !== 'object' || !('stream' in file)) {
    throw APIError.invalidArgument('Invalid file upload')
  }

  await s3Service.uploadFileAsync(c, `sources/${folderKey}/${sourceId}`, file)

  return c.json({ success: true })
})

router.delete('/folders/:folderKey/sources/:sourceId', requiredLogin, async c => {
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

  await s3Service.deleteFileAsync(c, `sources/${folderKey}/${sourceId}`)

  await prisma.source.delete({
    where: {
      id: sourceId
    }
  })

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

  const schedule = await prisma.schedule.create({
    data: {
      sourceId,
      folderId: folder.id,
      scheduledAt: new Date(scheduledAt)
    }
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

  return c.json({ success: true })
})

export default router
