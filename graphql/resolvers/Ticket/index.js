import ERROR from '../../../enums/states/error'

export default {
  Query: {
    getTickets: async (_, args, { models: { TicketModel } }) => {
      try {
        if (args.offset >= 0 && args.limit >= 0) {
          return await TicketModel.find()
            .sort({
              createdAt: -1
            })
            .skip(args.offset)
            .limit(args.limit)
        }
        if (args.search) {
          return await TicketModel.find({ $text: { $search: args.search } }).sort({
            createdAt: -1
          })
        }
        const tickets = await TicketModel.find().sort({ createdAt: -1 })
        return tickets
      } catch (err) {
        throw new Error(err)
      }
    },
    getTicket: async (_, { id }, { models: { TicketModel } }) => {
      try {
        const ticket = await TicketModel.findById(id)
        if (ticket) {
          return ticket
        } else {
          throw new Error(ERROR.TICKET_NOT_FOUND)
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createTicket: async (_, { input }, { models: { TicketModel } }) => {
      if (input.name.trim() === '') {
        throw new Error(ERROR.ROLE_NOT_EMPTY)
      }

      await TicketModel.create(input)

      return await TicketModel.find().sort({ createdAt: -1 })
    },
    updateTicket: async (_, { id, input }, { models: { TicketModel } }) => {
      if (input.body.trim() === '') {
        throw new Error(ERROR.TICKET_NOT_EMPTY)
      }

      const ticket = await TicketModel.findById(id)

      if (ticket) {
        ticket.title = input.title || ticket.title
        ticket.body = input.body || ticket.body
        ticket.сategory = input.сategory || ticket.сategory
        ticket.status = input.status || ticket.status
        await ticket.save()
      }

      return await TicketModel.find().sort({ createdAt: -1 })
    },
    deleteTicket: async (_, { id }, { models: { TicketModel } }) => {
      try {
        const ticket = await TicketModel.findById(id)
        await ticket.delete()
        return await TicketModel.find().sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
