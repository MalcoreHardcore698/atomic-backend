import ERROR from '../../../enums/states/error'

export default {
  Query: {
    getImages: async (_, args, { models: { ImageModel } }) => {
      try {
        if (args.search) {
          return await ImageModel.find({ $text: { $search: args.search } }).sort({
            createdAt: -1
          })
        }
        return await ImageModel.find(args).sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    },
    getImage: async (_, { id }, { models: { FileModel } }) => {
      try {
        const image = await FileModel.findById(id)
        if (image) {
          return image
        } else {
          return new Error(ERROR.IMAGE_NOT_FOUND)
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createImage: async (_, { file }, { storeUpload, models: { ImageModel } }) => {
      const image = await storeUpload(file)

      return await ImageModel.create({
        path: image.path,
        size: image.size,
        filename: image.filename
      })
    },
    updateImage: async (_, { id }, { models: { ImageModel } }) => {
      return await ImageModel.findById(id)
    },
    deleteImage: async (_, { id }, { models: { ImageModel } }) => {
      try {
        const image = await ImageModel.findById(id)
        await image.delete()
        return true
      } catch (err) {
        console.log(err)
        return false
      }
    }
  }
}
