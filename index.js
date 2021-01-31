import path from 'path'
import express from 'express'
import mkdirp from 'mkdirp'
import shrinkRay from 'shrink-ray-current'
import { createServer, mongoConnection } from './config'
import config from 'config'

async function start() {
  const PORT = config.get('port') || 5000
  const LOCAL_URL = config.get('server-local-url') || `http://localhost:${PORT}`
  const UPLOAD_DIR = config.get('upload-dir') || 'uploads'
  const NODE_ENV = process.env.NODE_ENV !== 'production'

  mkdirp.sync(UPLOAD_DIR)

  const app = express()
  const server = createServer()

  app.set('trust proxy', 1)

  await mongoConnection()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.use(shrinkRay())

  app.get('/', (req, res) => {
    return res.send('General API')
  })

  server.applyMiddleware({ app })

  app.listen({ port: PORT }, () => NODE_ENV && console.log(`🚀 Server ready at ${LOCAL_URL}`))
}

start().then()
