export default {
  Query: {
    getChat: async (_, { id }, { models: { ChatModel } }) => {
      try {
        return await ChatModel.findById(id)
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {}
}
