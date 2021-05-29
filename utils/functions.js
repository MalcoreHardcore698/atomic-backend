import { createWriteStream, existsSync, mkdirSync, unlink } from 'fs'
import nodemailer from 'nodemailer'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import rimraf from 'rimraf'
import config from 'config'
import { v4 } from 'uuid'

import models from '../models'

const { UserModel, NoticeModel, DashboardActivityModel } = models

const NODE_ENV = process.env.NODE_ENV !== 'production'
const SERVER_URL = NODE_ENV ? config.get('server-local-url') : config.get('server-host-url')
const UPLOAD_DIR = config.get('upload-dir')
const SECRET = config.get('secret')

export function sendMail(options) {
  const service = config.get('transporter-service')
  const auth = {
    user: config.get('transporter-auth-user'),
    pass: config.get('transporter-auth-pass')
  }

  const transporter = nodemailer.createTransport({ service, auth })

  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}

export async function getDocuments(Model, { find, sort = { createdAt: -1 }, skip, limit }) {
  return await Model.find(find).sort(sort).skip(skip).limit(limit)
}

export async function getValidDocuments(Model, findArgs, validateModels, validateCallback) {
  const documents = await getDocuments(Model, findArgs)

  const result = []
  for (let document of documents) {
    const candidate = await validateCallback(validateModels, document)
    if (candidate) {
      result.push(document)
    }
  }

  return result
}

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
  const replaced = path.replace('uploads', 'public/uploads')
  const splitted = replaced.split('/')
  const origin = splitted.slice(3, splitted.length - 1).join('/')
  return rimraf(`./${origin}`, () => {})
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

export async function safeDocuments(Model, limit, sort) {
  const documents = await Model.find().sort(sort).limit(limit)
  const documentsIdsForSafe = documents.map((document) => document.id)
  const documentsForDelete = await Model.find({
    _id: {
      $not: {
        $in: documentsIdsForSafe
      }
    }
  })
  await Model.deleteMany({
    _id: documentsForDelete.map((document) => document.id)
  })
}

export async function safeDashboardActivities(limit, sort = { createdAt: -1 }) {
  return safeDocuments(DashboardActivityModel, limit, sort)
}

export async function safeNotifications(limit, sort = { createdAt: -1 }) {
  return safeDocuments(NoticeModel, limit, sort)
}

export async function createDashboardActivity(args) {
  await DashboardActivityModel.create(args)
  await safeDashboardActivities(10)
}

export async function createNotice(args) {
  await NoticeModel.create(args)
  await safeNotifications(10)
}

export function getDateByMonth(offset = 0) {
  const date = new Date()
  return new Date(date.setMonth(date.getMonth() - offset))
}

export async function getDocumentGraph(Model) {
  const monthsArray = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const documents = await Model.aggregate([
    {
      $match: {
        createdAt: { $gte: getDateByMonth(5), $lte: getDateByMonth() }
      }
    },
    {
      $group: {
        _id: { year_month: { $substrCP: ['$createdAt', 0, 7] } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year_month': 1 }
    },
    {
      $project: {
        _id: 0,
        count: 1,
        month_year: {
          $concat: [
            {
              $arrayElemAt: [
                monthsArray,
                { $subtract: [{ $toInt: { $substrCP: ['$_id.year_month', 5, 2] } }, 1] }
              ]
            },
            '-',
            { $substrCP: ['$_id.year_month', 0, 4] }
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        data: { $push: { k: '$month_year', v: '$count' } }
      }
    },
    {
      $project: {
        data: { $arrayToObject: '$data' },
        _id: 0
      }
    }
  ])

  return Object.entries(documents[0]?.data).map(([date, count]) => ({
    count,
    createdAt: new Date(date)
  }))
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

export async function parseToQueryCompany(company) {
  const isValidCompany = mongoose.Types.ObjectId.isValid(company)
  const candidate = !isValidCompany && (await UserModel.findOne({ email: company }))

  return isValidCompany ? company : candidate ? { company: candidate.id } : {}
}

export function parseToQueryDate(date, field = 'createdAt') {
  const startOfDay = new Date(parseInt(date))
  const endOfDay = new Date(parseInt(date))

  startOfDay.setHours(0,0,0,0)
  endOfDay.setHours(23,59,59,999)

  return date ? { [field]: { $gte: startOfDay, $lte: endOfDay } } : {}
}
