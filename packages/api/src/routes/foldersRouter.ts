import { Hono } from "hono"
import { APIEnv } from "../@types"
import requiredLogin from "../middlewares/requiredLogin"
import { Source } from "chronocast"
import APIError from "../libs/APIError"

const router = new Hono<APIEnv>()

router.get('/folders/:folderKey/sources', requiredLogin, async (c) => {
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

router.get('/folders/:folderKey/schedules', requiredLogin, async (c) => {
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

export default router
