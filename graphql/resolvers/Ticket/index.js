import { TICKET_NOT_EMPTY, TICKET_NOT_FOUND } from '../../../enums/states/error'
import { UNREADED } from '../../../enums/states/message'
import { OPENED, CLOSED } from '../../../enums/states/chat'

export default {
  Query: {
    getTickets: async (_, args, { models: { TicketModel } }) => {
      const search = args.search ? { $text: { $search: args.search } } : {}
      const category = args.category ? { category: args.category } : {}

      try {
        if (args.offset >= 0 && args.limit >= 0) {
          return await TicketModel.find({ ...category, ...search })
            .sort({
              createdAt: -1
            })
            .skip(args.offset)
            .limit(args.limit)
        }
        if (args.search) {
          return await TicketModel.find({ ...category, ...search }).sort({
            createdAt: -1
          })
        }
        return await TicketModel.find({ ...category, ...search }).sort({ createdAt: -1 })
      } catch (err) {
        return new Error(err)
      }
    },
    getTicket: async (_, { id }, { models: { TicketModel } }) => {
      try {
        const ticket = await TicketModel.findById(id)
        if (ticket) {
          return ticket
        } else {
          return new Error(TICKET_NOT_FOUND)
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createTicket: async (
      _,
      { input },
      { models: { UserModel, TicketModel, TicketMessageModel } }
    ) => {
      if (input.title.trim() === '') {
        return new Error(TICKET_NOT_EMPTY)
      }

      const author = await UserModel.findOne({ email: input.author })
      const counsellor = await UserModel.findOne({ email: input.counsellor })

      if (author && counsellor) {
        const ticket = await TicketModel.create({
          ...input,
          author: author.id,
          counsellor: counsellor.id,
          status: OPENED
        })

        if (input.message) {
          const message = await TicketMessageModel.create({
            user: author.id,
            ticket: ticket.id,
            text: input.message,
            type: UNREADED
          })

          if (message) {
            ticket.messages = [message.id]
            await ticket.save()
          }
        }
      }

      return await TicketModel.find().sort({ createdAt: -1 })
    },
    updateTicket: async (
      _,
      { id, input },
      { models: { UserModel, TicketModel, TicketMessageModel } }
    ) => {
      const ticket = await TicketModel.findById(id)
      const author = await UserModel.findOne({ email: input.email })
      const counsellor = await UserModel.findOne({ email: input.counsellor })

      if (author && counsellor) {
        ticket.title = input.title || ticket.title
        ticket.author = author?.id || ticket.author
        ticket.counsellor = counsellor?.id || ticket.counsellor
        ticket.category = input.category || ticket.category
        ticket.status = input.status || ticket.status

        if (input.message && ticket.messages.length === 0) {
          const message = await TicketMessageModel.create({
            user: author.id,
            ticket: ticket.id,
            text: input.message,
            type: UNREADED
          })

          if (message) {
            ticket.messages = [message.id]
          }
        }

        await ticket.save()
      }

      return await TicketModel.find().sort({ createdAt: -1 })
    },
    sendMessage: async (
      _,
      { ticket, recipient, text },
      { user, models: { UserModel, TicketModel, TicketMessageModel } }
    ) => {
      const candidate = await UserModel.findOne({ email: recipient })

      if (candidate) {
        const foundedTicket = await TicketModel.findById(ticket)

        if (!foundedTicket) return []

        const message = await TicketMessageModel.create({
          text,
          ticket,
          user: user.id,
          type: UNREADED
        })
        foundedTicket.messages = [...foundedTicket.messages, message.id]
        await foundedTicket.save()

        return await TicketMessageModel.find({ ticket, user: user.id })
      }

      return []
    },
    deleteTicket: async (_, { id }, { models: { TicketModel, TicketMessageModel } }) => {
      try {
        const ticket = await TicketModel.findById(id)

        await ticket.delete()
        for (let message of ticket.messages) {
          const candidate = await TicketMessageModel.findById(message)
          await candidate.delete()
        }

        return await TicketModel.find().sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    },
    closeTicket: async (_, { id }, { models: { TicketModel } }) => {
      try {
        const ticket = await TicketModel.findById(id)
        ticket.status = CLOSED
        await ticket.save()
        return ticket
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
