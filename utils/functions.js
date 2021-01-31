import { createWriteStream, existsSync, mkdirSync, unlink } from 'fs'
import jwt from 'jsonwebtoken'
import rimraf from 'rimraf'
import { v4 } from 'uuid'
import config from 'config'
import models from '../models'

const { UserModel } = models

const NODE_ENV = process.env.NODE_ENV !== 'production'
const SERVER_URL = NODE_ENV ? config.get('server-local-url') : config.get('server-host-url')
const UPLOAD_DIR = config.get('upload-dir')
const SECRET = config.get('secret')

export async function getUser(req) {
  const token = req.headers.authorization || ''

  if (token) {
    const tokenValue = token.replace('Bearer ', '')
    const result = await jwt.verify(tokenValue, SECRET)
    if (result && result.uid) {
      const user = await UserModel.findById(result.uid)
      if (user) {
        return user
      } else {
        return new Error('User not found')
      }
    } else {
      return new Error('ID not found')
    }
  }

  return null
}

export async function storeUpload(upload) {
  const { createReadStream, filename, mimetype } = await upload
  if (!createReadStream || !filename || !mimetype) return false

  const id = v4()
  const stream = createReadStream()

  const dirname = v4()
  if (!existsSync(`./public/${UPLOAD_DIR}/${dirname}`)) {
    mkdirSync(`./public/${UPLOAD_DIR}/${dirname}`)
  }

  const path = `${UPLOAD_DIR}/${dirname}/${id}-${filename}`
  const pathOnDisc = `./public/${path}`
  const file = { id, mimetype, filename, path: `${SERVER_URL}/${path}` }

  await new Promise((resolve, reject) => {
    const writeStream = createWriteStream(pathOnDisc)

    writeStream.on('finish', resolve)
    writeStream.on('error', (error) => {
      unlink(pathOnDisc, () => {
        reject(error)
      })
    })

    stream.on('error', (error) => writeStream.destroy(error))
    stream.pipe(writeStream)
  })

  return file
}

export async function storeRimraf(path) {
  const parts = path.split('/')
  const origin = parts.slice(0, parts.length - 1).join('/')
  await rimraf(origin, () => {})
}

export async function createUpload(file, size, model) {
  if (file) {
    const upload = await storeUpload(file)
    if (upload) {
      return await model.create({
        size,
        path: upload.path,
        filename: upload.filename
      })
    }
    return null
  }
  return null
}

export async function createUploads(files, sizes, model) {
  if (files && files.length > 0) {
    const result = []
    for (let i = 0; i < files.length; i++) {
      const document = await createUpload(files[i], sizes[i], model)
      if (document) result.push(document.id)
    }
    return result
  }
  return null
}

export async function deleteUpload(id, model) {
  const file = await model.findById(id)
  if (file) {
    await storeRimraf(file.path)
    await file.delete()
  }
}

export async function deleteUploads(files, model) {
  for (let id of files) {
    await deleteUpload(id, model)
  }
}

export function parseCookie(cookie, cname) {
  const name = cname + '='
  const decodedCookie = decodeURIComponent(cookie)
  const ca = decodedCookie.split(';')

  let r = ''

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]

    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }

    if (c.indexOf(name) === 0) {
      r = c.substring(name.length, c.length)
    }
  }

  return r.replace('"', '').replace('"', '')
}
