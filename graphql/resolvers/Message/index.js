import { AuthenticationError, UserInputError } from 'apollo-server-express'
import { MESSAGE_NOT_FOUND } from '../../../enums/states/error'
import { READED } from '../../../enums/states/message'

export default {
  Query: {},
  Mutation: {
    readMessages: async (_, { id: ids }, { models: { MessageModel } }) => {
      for (let id of ids) {
        const message = await MessageModel.findById(id)

        if (message) {
          message.type = READED

          await message.save()
        } else {
          throw new UserInputError(MESSAGE_NOT_FOUND)
        }
      }

      return true
    }
  }
}
