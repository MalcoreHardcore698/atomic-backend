import { getDocuments } from '../../../utils/functions'

export default {
  Query: {
    getDashboardActivities: async (_, args, { models: { DashboardActivityModel } }) => {
      try {
        const search = args.search ? { message: { $regex: args.search, $options: 'i' } } : {}
        const sort = args.sort ? { [args.sort]: 1 } : { createdAt: -1 }
        const find = { ...search }

        return await getDocuments(DashboardActivityModel, {
          find,
          sort,
          skip: args.offset,
          limit: args.limit
        })
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {}
}
