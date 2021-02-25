import { FILE_NOT_FOUND } from '../../../enums/states/error'
import { getDocuments } from '../../../utils/functions'

export default {
  Query: {
    getFiles: async (_, args, { models: { FileModel } }) => {
      try {
        const search = args.search ? { $text: { $search: args.search } } : {}
        const find = { ...search }

        return await getDocuments(FileModel, {
          find,
          skip: args.offset,
          limit: args.limit
        })
      } catch (err) {
        throw new Error(err)
      }
    },
    getFile: async (_, { id }, { models: { FileModel } }) => {
      try {
        const file = await FileModel.findById(id)

        if (file) return file
        else return new Error(FILE_NOT_FOUND)
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createFile: async (_, { file }, { storeUpload, models: { FileModel } }) => {
      try {
        const doc = await storeUpload(file)

        return await FileModel.create({
          path: doc.path,
          size: doc.size,
          filename: doc.filename
        })
      } catch (err) {
        throw new Error(err)
      }
    },
    updateFile: async (_, { id }, { models: { FileModel } }) => {
      try {
        return await FileModel.findById(id)
      } catch (err) {
        throw new Error(err)
      }
    },
    deleteFile: async (_, { id }, { models: { FileModel } }) => {
      try {
        const file = await FileModel.findById(id)
        await file.delete()
        return true
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
