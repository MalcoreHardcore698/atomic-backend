import { getValidDocuments } from '../../../utils/functions'
import { TICKET_NOT_EMPTY, TICKET_NOT_FOUND } from '../../../enums/states/error'
import { OPENED, CLOSED } from '../../../enums/states/chat'
import { UNREADED } from '../../../enums/states/message'

export async function checkValidTicket({ UserModel, CategoryModel }, ticket) {
  const author = await UserModel.findById(ticket.author)
  const counsellor = await UserModel.findById(ticket.counsellor)
  const category = await CategoryModel.findById(ticket.category)

  if (!author || !counsellor || !category) {
    await ticket.delete()
    return false
  }

  return true
}

export async function getTickets({ TicketModel, UserModel, CategoryModel }, args) {
  return await getValidDocuments(TicketModel, args, { UserModel, CategoryModel }, checkValidTicket)
}

export default {
  Query: {
    getTickets: async (_, args, { models: { TicketModel, UserModel, CategoryModel } }) => {
      try {
        const search = args.search ? { $text: { $search: args.search } } : {}
        const category = args.category ? { category: args.category } : {}
        const find = { ...category, ...search }

        return await getTickets(
          { TicketModel, UserModel, CategoryModel },
          {
            find,
            skip: args.offset,
            limit: args.limit
          }
        )
      } catch (err) {
        return new Error(err)
      }
    },
    getUserTickets: async (
      _,
      args,
      { user, models: { TicketModel, UserModel, CategoryModel } }
    ) => {
      if (!user) return []

      try {
        const search = args.search ? { $text: { $search: args.search } } : {}
        const category = args.category ? { category: args.category } : {}
        const find = { ...category, ...search, author: user.id, status: OPENED }

        return await getTickets(
          { TicketModel, UserModel, CategoryModel },
          {
            find,
            skip: args.offset,
            limit: args.limit
          }
        )
      } catch (err) {
        throw new Error(err)
      }
    },
    getTicket: async (_, { id }, { models: { TicketModel, UserModel, CategoryModel } }) => {
      try {
        const ticket = await TicketModel.findById(id)
        const candidate = await checkValidTicket({ UserModel, CategoryModel }, ticket)

        if (candidate) return ticket
        else return new Error(TICKET_NOT_FOUND)
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createUserTicket: async (
      _,
      { input },
      { user, models: { UserModel, RoleModel, TicketModel, TicketMessageModel } }
    ) => {
      if (input.title.trim() === '') {
        return new Error(TICKET_NOT_EMPTY)
      }

      const admin = await RoleModel.findOne({ name: 'ADMIN' })
      const moderator = await RoleModel.findOne({ name: 'MODERATOR' })
      const candidates = await UserModel.find({ role: [admin.id, moderator.id] })
      const counsellor = candidates[Math.floor(Math.random() * candidates.length)]

      const ticket = await TicketModel.create({
        ...input,
        author: user.id,
        counsellor: counsellor.id,
        status: OPENED
      })

      const message = await TicketMessageModel.create({
        user: user.id,
        ticket: ticket.id,
        text: input.message,
        type: UNREADED
      })

      if (message) {
        ticket.messages = [message.id]
        await ticket.save()
      }

      return true
    },
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

      ticket.title = input.title || ticket.title
      ticket.author = author?.id || ticket.author
      ticket.counsellor = counsellor?.id || ticket.counsellor
      ticket.category = input.category || ticket.category
      ticket.status = input.status || ticket.status

      for (let i = 0; i < ticket.messages.length; i++) {
        const message = await TicketMessageModel.findById(ticket.messages[i])
        if (input.messages[i]) {
          message.text = input.messages[i].text
          await message.save()
        } else {
          await message.delete()
          ticket.messages = ticket.messages.filter((id) => !message.equals(id))
        }
      }

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

      return await TicketModel.find().sort({ createdAt: -1 })
    },
    sendTicketMessage: async (
      _,
      { ticket, recipient, text, isClient },
      { user, models: { UserModel, TicketModel, TicketMessageModel } }
    ) => {
      const candidate = await UserModel.findOne({ email: recipient })

      if (candidate) {
        const foundedTicket = await TicketModel.findById(ticket)

        if (!foundedTicket) return []

        const message = await TicketMessageModel.create({
          text,
          ticket,
          user: isClient ? user.id : foundedTicket.counsellor,
          type: UNREADED
        })
        foundedTicket.messages = [...foundedTicket.messages, message.id]
        await foundedTicket.save()

        return await TicketMessageModel.find({ ticket })
      }

      return []
    },
    deleteTicket: async (_, { id }, { models: { TicketModel, TicketMessageModel } }) => {
      try {
        const ticket = await TicketModel.findById(id)

        for (let id of ticket.messages) {
          const message = await TicketMessageModel.findById(id)
          await message.delete()
        }
        await ticket.delete()

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
