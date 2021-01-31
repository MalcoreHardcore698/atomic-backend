import { ApolloServer, PubSub } from 'apollo-server-express'
import {
  storeUpload,
  createUpload,
  createUploads,
  deleteUpload,
  deleteUploads
} from '../utils/functions'
import typeDefs from '../graphql/schema'
import resolvers from '../graphql/resolvers'
import models from '../models'
import { getUser } from '../utils/functions'

export default function createServer() {
  const pubsub = new PubSub()
  const manipulations = { storeUpload, createUpload, createUploads, deleteUpload, deleteUploads }

  return new ApolloServer({
    introspection: true,
    playground: true,
    resolvers,
    typeDefs,
    context: async ({ req, res, connection }) => {
      if (connection) {
        return { storeUpload, deleteUpload, deleteUploads, pubsub }
      } else {
        const user = await getUser(req)

        return {
          ...manipulations,
          typeDefs,
          resolvers,
          models,
          pubsub,
          user,
          req,
          res
        }
      }
    },
    formatError: (err) => {
      if (err.message.startsWith('Database Error: ')) {
        return new Error('Ошибка сервера')
      }
      return err
    }
  })
}
