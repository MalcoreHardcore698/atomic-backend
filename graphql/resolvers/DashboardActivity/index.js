import { getDocuments } from '../../../utils/functions'

export default {
  Query: {
    getDashboardActivities: async (_, args, { models: { DashboardActivityModel } }) => {
      try {
        const search = args.search ? { $text: { $search: args.search } } : {}
        const find = { ...search }

        return await getDocuments(DashboardActivityModel, {
          find,
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
