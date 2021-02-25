import { getDocuments } from '../../../utils/functions'
import { IMAGE_NOT_FOUND } from '../../../enums/states/error'

export default {
  Query: {
    getImages: async (_, args, { models: { ImageModel } }) => {
      try {
        const search = args.search ? { $text: { $search: args.search } } : {}
        const find = { ...search }

        return await getDocuments(ImageModel, {
          find,
          skip: args.offset,
          limit: args.limit
        })
      } catch (err) {
        throw new Error(err)
      }
    },
    getImage: async (_, { id }, { models: { FileModel } }) => {
      try {
        const image = await FileModel.findById(id)

        if (image) return image
        else return new Error(IMAGE_NOT_FOUND)
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createImage: async (_, { file }, { storeUpload, models: { ImageModel } }) => {
      try {
        const image = await storeUpload(file)

        return await ImageModel.create({
          path: image.path,
          size: image.size,
          filename: image.filename
        })
      } catch (err) {
        throw new Error(err)
      }
    },
    updateImage: async (_, { id }, { models: { ImageModel } }) => {
      try {
        return await ImageModel.findById(id)
      } catch (err) {
        throw new Error(err)
      }
    },
    deleteImage: async (_, { id }, { models: { ImageModel } }) => {
      try {
        const image = await ImageModel.findById(id)
        await image.delete()
        return true
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
