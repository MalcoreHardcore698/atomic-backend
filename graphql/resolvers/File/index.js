import ERROR from '../../../enums/states/error'

export default {
  Query: {
    getFiles: async (_, args, { models: { FileModel } }) => {
      try {
        if (args.offset >= 0 && args.limit >= 0) {
          return await FileModel.find()
            .sort({
              createdAt: -1
            })
            .skip(args.offset)
            .limit(args.limit)
        }
        if (args.search) {
          return await FileModel.find({ $text: { $search: args.search } }).sort({
            createdAt: -1
          })
        }
        return await FileModel.find(args).sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    },
    getFile: async (_, { id }, { models: { FileModel } }) => {
      try {
        const file = await FileModel.findById(id)
        if (file) {
          return file
        } else {
          return new Error(ERROR.FILE_NOT_FOUND)
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createFile: async (_, { file }, { storeUpload, models: { FileModel } }) => {
      const doc = await storeUpload(file)

      return await FileModel.create({
        path: doc.path,
        size: doc.size,
        filename: doc.filename
      })
    },
    updateFile: async (_, { id }, { models: { FileModel } }) => {
      return await FileModel.findById(id)
    },
    deleteFile: async (_, { id }, { models: { FileModel } }) => {
      try {
        const file = await FileModel.findById(id)
        await file.delete()
        return true
      } catch (err) {
        console.log(err)
        return false
      }
    }
  }
}
