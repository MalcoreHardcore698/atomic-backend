import { UserInputError } from 'apollo-server-express'
import { v4 } from 'uuid'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { validateLoginInput, validateRegisterInput } from '../../../utils/validators'
import { authenticateFacebook, authenticateGoogle } from '../../../utils/passport'
import { USER, ENTITY, INDIVIDUAL, OFICIAL } from '../../../enums/types/account'
import { UNREADED } from '../../../enums/states/message'
import { PERSONAL } from '../../../enums/types/chat'
import { OPENED } from '../../../enums/states/chat'
import { USER_IS_EXIST, USER_NOT_FOUND, WRONG_CREDENTIALS } from '../../../enums/states/error'
import config from 'config'

const SALT = config.get('salt')
const SECRET = config.get('secret')

export default {
  Query: {
    getUsers: async (_, args, { models: { UserModel } }) => {
      try {
        if (args.offset >= 0 && args.limit >= 0) {
          return await UserModel.find()
            .sort({
              createdAt: -1
            })
            .skip(args.offset)
            .limit(args.limit)
        }
        if (args.search) {
          return await UserModel.find({
            $text: { $search: args.search.toString() },
            account: args?.account || [INDIVIDUAL, OFICIAL, ENTITY]
          }).sort({
            createdAt: -1
          })
        }
        return await UserModel.find({
          ...(args.email ? { email: { $nin: args.email } } : {}),
          ...(args.company ? { company: args.company } : {}),
          account: args?.account || [INDIVIDUAL, OFICIAL, ENTITY]
        }).sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    },
    getUser: async (_, { email }, { user, models: { UserModel } }) => {
      if (email) {
        return UserModel.findOne({ email })
      }

      if (user) {
        return user
      }

      return null
    },
    getUserChats: async (_, args, { user, models: { UserChatModel } }) => {
      if (!user) return []
      const userChats = await UserChatModel.find({ user: user.id, status: OPENED })
      if (userChats) return userChats
      return []
    },
    getUserMembers: async (_, { email }, { models: { UserModel } }) => {
      const user = await UserModel.findOne({ email })
      if (user) return await UserModel.find({ company: user.id })
      return []
    },
    checkUser: async (_, { search }, { models: { UserModel } }) => {
      const user = await UserModel.findOne({
        $or: [{ email: search }, { phone: search }]
      })

      if (user) {
        if (user.email === search) {
          return { status: 'success', message: 'Пользователя с таким эл. адресом не существует' }
        }
        if (user.phone === search) {
          return { status: 'success', message: 'Пользователя с таким телефоном не существует' }
        }
      }
      return { status: 'error', message: 'Пользователь уже существует' }
    }
  },
  Mutation: {
    checkin: async (_, { login }, { models: { UserModel } }) => {
      if (!login) {
        throw new UserInputError('Errors', {
          error: 'Неправильный адрес эл. почты или номер телефона'
        })
      }

      const candidate = await UserModel.findOne({ $or: [{ email: login }, { phone: login }] })

      return !!candidate
    },
    login: async (_, { login, password }, { models: { UserModel } }) => {
      const { errors, valid } = validateLoginInput(login, password)

      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }

      const user = await UserModel.findOne({ $or: [{ email: login }, { phone: login }] })

      if (!user) {
        throw new UserInputError(USER_NOT_FOUND)
      }

      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        throw new UserInputError(WRONG_CREDENTIALS, { errors })
      }

      const isMatch = bcrypt.compareSync(password, user.password)

      if (!isMatch) {
        throw new Error('Wrong password')
      }

      return {
        ...user._doc,
        token: jwt.sign({ uid: user._id }, SECRET)
      }
    },
    logout: async (_, args, { user }) => {
      if (!user) return false

      user.sessionID = v4()
      await user.save()

      return true
    },
    googleAuth: async (
      parent,
      { accessToken },
      { req, res, models: { UserModel, ImageModel, RoleModel } }
    ) => {
      req.body = {
        ...req.body,
        access_token: accessToken
      }

      try {
        const { data } = await authenticateGoogle(req, res)

        if (data) {
          const { profile, accessToken } = data
          const email = profile && profile.emails && profile.emails[0] && profile.emails[0].value
          const name = profile && profile.displayName
          const user = await UserModel.findOne({ email })

          if (!user) {
            const account = INDIVIDUAL
            const role = await RoleModel.findOne({ name: USER })
            const avatar =
              profile &&
              profile._json &&
              (await ImageModel.create({
                filename: profile._json.picture,
                path: profile._json.picture,
                size: 10
              }))

            const newUser = await UserModel.create({
              name,
              role,
              email,
              avatar,
              account,
              googleAccount: {
                accessToken
              }
            })

            return {
              ...newUser._doc,
              token: jwt.sign({ uid: newUser._id }, SECRET)
            }
          }

          if (user) {
            const newUser = await UserModel.findOneAndUpdate(
              { email },
              {
                googleAccount: {
                  accessToken
                }
              },
              { new: true }
            )

            return {
              ...newUser._doc,
              register: true,
              token: jwt.sign({ uid: user._id }, SECRET)
            }
          }
        } else {
          return new Error('Authentication Failure!')
        }
      } catch (error) {
        throw new Error(error)
      }
    },
    facebookAuth: async (
      parent,
      { accessToken },
      { req, res, models: { UserModel, ImageModel, RoleModel } }
    ) => {
      req.body = {
        ...req.body,
        access_token: accessToken
      }

      try {
        const { data } = await authenticateFacebook(req, res)

        if (data) {
          const { profile, accessToken } = data
          const email = profile && profile.emails && profile.emails[0] && profile.emails[0].value
          const name = profile && profile.displayName
          const user = await UserModel.findOne({ email })

          if (!user) {
            const account = INDIVIDUAL
            const role = await RoleModel.findOne({ name: USER })
            const avatar =
              profile &&
              profile.photos &&
              profile.photos[0] &&
              (await ImageModel.create({
                filename: profile.photos[0].value,
                path: profile.photos[0].value,
                size: 10
              }))

            const newUser = await UserModel.create({
              name,
              role,
              email,
              avatar,
              account,
              facebookAccount: {
                accessToken
              }
            })

            return {
              ...newUser._doc,
              token: jwt.sign({ uid: newUser._id }, SECRET)
            }
          }

          if (user) {
            const newUser = await UserModel.findOneAndUpdate(
              { email },
              {
                facebookAccount: {
                  accessToken
                }
              },
              { new: true }
            )

            return {
              ...newUser._doc,
              register: true,
              token: jwt.sign({ uid: user._id }, SECRET)
            }
          }
        } else {
          return new Error('Authentication Failure!')
        }
      } catch (error) {
        throw new Error(error)
      }
    },
    register: async (
      _,
      { input: { name, account, email, phone, password, confirmPassword } },
      { models: { RoleModel, UserModel } }
    ) => {
      const { valid, errors } = validateRegisterInput(name, email, password, confirmPassword)
      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }

      const user = await UserModel.findOne({ $or: [{ name }, { email }, { phone }] })
      if (user) {
        throw new UserInputError(USER_IS_EXIST)
      }

      const role = await RoleModel.findOne({ name: USER })

      const bcryptPassword = await bcrypt.hashSync(password, SALT)

      const newUser = await UserModel.create({
        name,
        role,
        account,
        email,
        phone,
        password: bcryptPassword,
        confirmPassword
      })

      return {
        ...newUser._doc,
        token: jwt.sign({ uid: newUser._id }, SECRET)
      }
    },
    createUser: async (_, { input }, { createUpload, models: { UserModel, ImageModel } }) => {
      const candidate = await UserModel.findOne({
        $or: [{ email: input.email }, { phone: input.phone }]
      })

      if (!candidate) {
        const user = new UserModel({
          ...input
        })

        if (input.company) {
          const company = await UserModel.findOne({ email: input.company })
          if (company && company.account === ENTITY) user.company = company.id
        }

        if (input.password) {
          user.password = await bcrypt.hashSync(input.password, SALT)
        }

        const avatar = await createUpload(input.avatar, input.avatarSize, ImageModel)
        if (avatar) user.avatar = avatar

        await user.save()
      }

      return await UserModel.find().sort({ createdAt: -1 })
    },
    updateClientUser: async (
      _,
      { input },
      { user, deleteUpload, createUpload, models: { UserModel, ImageModel } }
    ) => {
      user.name = input.name || user.name
      user.about = input.about || user.about
      user.email = input.email || user.email
      user.phone = input.phone || user.phone
      user.gender = input.gender || user.gender
      user.account = input.account || user.account
      user.dateOfBirth = input.dateOfBirth || user.dateOfBirth

      if (input.company) {
        const company = await UserModel.findOne({ email: input.company })
        if (company && company.account === ENTITY) user.company = company.id
      }

      if (input.password) user.password = input.password

      const avatar = await createUpload(input.avatar, input.avatarSize, ImageModel)
      if (avatar) {
        await deleteUpload(user.avatar, ImageModel)
        user.avatar = avatar
      }

      await user.save()

      return user
    },
    updateUser: async (
      _,
      { email, input },
      { deleteUpload, createUpload, models: { UserModel, ImageModel } }
    ) => {
      const user = await UserModel.findOne({ email })

      if (user) {
        user.name = input.name || user.name
        user.about = input.about || user.about
        user.email = input.email || user.email
        user.phone = input.phone || user.phone
        user.gender = input.gender || user.gender
        user.account = input.account || user.account
        user.dateOfBirth = input.dateOfBirth || user.dateOfBirth

        if (input.company) {
          const company = await UserModel.findOne({ email: input.company })
          if (company && company.account === ENTITY) user.company = company.id
        }

        if (input.password) user.password = input.password

        const avatar = await createUpload(input.avatar, input.avatarSize, ImageModel)
        if (avatar) {
          await deleteUpload(user.avatar, ImageModel)
          user.avatar = avatar
        }

        await user.save()
      }

      return await UserModel.find().sort({ createdAt: -1 })
    },
    sendMessage: async (
      _,
      { recipient, text },
      { user, models: { UserModel, ChatModel, MessageModel } }
    ) => {
      const candidate = await UserModel.findOne({ email: recipient })

      if (candidate) {
        const chat = await ChatModel.findOne({
          $and: [{ members: { $in: [user.id] } }, { members: { $in: [candidate.id] } }]
        })

        if (!chat) return []

        const message = await MessageModel.create({ chat, user: user.id, text, type: UNREADED })
        chat.messages = [...chat.messages, message.id]
        await chat.save()

        return await MessageModel.find({ chat, user: user.id })
      }

      return []
    },
    addUserChat: async (
      _,
      { recipient },
      { user, models: { UserModel, UserChatModel, ChatModel } }
    ) => {
      if (!user) return false

      const candidate = await UserModel.findOne({ email: recipient })

      if (candidate) {
        const chat = await ChatModel.findOne({
          $and: [{ members: { $in: [user.id] } }, { members: { $in: [candidate.id] } }]
        })

        if (chat) {
          const userChat = await UserChatModel.findOne({ chat: chat.id, user: user.id })
          if (userChat) {
            userChat.status = OPENED
            await userChat.save()
          } else {
            await UserChatModel.create({ chat: chat.id, user: user.id, status: OPENED })
          }

          const recipientChat = await UserChatModel.findOne({ chat: chat.id, user: candidate.id })
          if (recipientChat) {
            recipientChat.status = OPENED
            await recipientChat.save()
          } else {
            await UserChatModel.create({ chat: chat.id, user: candidate.id, status: OPENED })
          }
        } else {
          const newChat = await ChatModel.create({
            type: PERSONAL,
            title: `Чат с ${candidate.name}`,
            members: [user.id, candidate.id],
            messages: []
          })

          await UserChatModel.create({ chat: newChat.id, user: user.id, status: OPENED })
          await UserChatModel.create({ chat: newChat.id, user: candidate.id, status: OPENED })
        }

        return true
      }

      return false
    },
    addUserFolder: async (_, { name }, { user }) => {
      if (user) {
        const folder = { name, projects: [] }
        user.folders = [...user.folders, folder]
        await user.save()
      }

      return user?.folders || []
    },
    addUserProject: async (_, { project, folder }, { user }) => {
      if (user) {
        for (let item of user.folders) {
          if (item.id === folder) {
            user.folders = user.folders.map((f) =>
              f.id === folder
                ? {
                    ...f._doc,
                    projects: [...f.projects, project]
                  }
                : { ...f._doc }
            )
            await user.save()
            return true
          }
        }
      }
      return false
    },
    deleteUserFolder: async (_, { id }, { user }) => {
      if (user) {
        user.folders = user.folders.filter((folder) => folder.id !== id)
        await user.save()
      }

      return user?.folders || []
    },
    deleteUser: async (_, { email }, { deleteUpload, models: { UserModel, ImageModel } }) => {
      try {
        const user = await UserModel.findOne({ email })

        deleteUpload(user.avatar, ImageModel)

        await user.delete()
        return await UserModel.find().sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
