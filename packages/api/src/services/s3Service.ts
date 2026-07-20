import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { APIContext } from '../@types'

const getPresignedUrlAsync = async (c: APIContext, key: string): Promise<string | null> => {
  const s3 = c.get('s3')

  try {
    const headCommand = new HeadObjectCommand({
      Bucket: c.env.S3_BUCKET_NAME,
      Key: key
    })
    await s3.send(headCommand)
  }
  catch {
    return null
  }

  const command = new GetObjectCommand({
    Bucket: c.env.S3_BUCKET_NAME,
    Key: key
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 60 * 24 })
  return url
}

const uploadFileAsync = async (c: APIContext, key: string, file: File) => {
  const s3 = c.get('s3')
  const fileBuffer = await file.arrayBuffer()
  const command = new PutObjectCommand({
    Bucket: c.env.S3_BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(fileBuffer),
    ContentType: file.type
  })
  await s3.send(command)
}

const getObjectStreamAsync = async (c: APIContext, key: string) => {
  const s3 = c.get('s3')

  try {
    const headCommand = new HeadObjectCommand({
      Bucket: c.env.S3_BUCKET_NAME,
      Key: key
    })
    await s3.send(headCommand)
  }
  catch {
    return null
  }

  const command = new GetObjectCommand({
    Bucket: c.env.S3_BUCKET_NAME,
    Key: key
  })

  const response = await s3.send(command)
  return response
}

const deleteFileAsync = async (c: APIContext, key: string) => {
  const s3 = c.get('s3')

  try {
    const headCommand = new HeadObjectCommand({
      Bucket: c.env.S3_BUCKET_NAME,
      Key: key
    })
    await s3.send(headCommand)
  }
  catch {
    return
  }

  const command = new DeleteObjectCommand({
    Bucket: c.env.S3_BUCKET_NAME,
    Key: key
  })
  await s3.send(command)
}

export default {
  getPresignedUrlAsync,
  uploadFileAsync,
  getObjectStreamAsync,
  deleteFileAsync
}
