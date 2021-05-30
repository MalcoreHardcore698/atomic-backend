import { getDocuments } from '../../../utils/functions'
import { NOTICE_NOT_FOUND } from '../../../enums/states/error'

export default {
  Query: {
    getNotifications: async (_, args, { models: { NoticeModel, UserModel } }) => {
      try {
        const authorOne = await UserModel.findOne({ email: args.author })
        const author = authorOne ? { author: authorOne.id } : {}
        const search = args.search ? { title: { $regex: args.search, $options: 'i' } } : {}
        const sort = args.sort ? { [args.sort]: 1 } : { createdAt: -1 }
        const find = { ...author, ...search }

        return await getDocuments(NoticeModel, {
          find,
          sort,
          skip: args.offset,
          limit: args.limit
        })
      } catch (err) {
        throw new Error(err)
      }
    },
    getNotice: async (_, { id }, { models: { NoticeModel } }) => {
      try {
        const notice = await NoticeModel.findById(id)

        if (notice) return notice
        else return new Error(NOTICE_NOT_FOUND)
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {}
}
