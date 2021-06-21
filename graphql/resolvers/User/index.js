import { UserInputError } from 'apollo-server-express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import config from 'config'
import { v4 } from 'uuid'

import { randomString } from '../../../functions/string-functions'
import { validateLoginInput, validateRegisterInput } from '../../../utils/validators'
import { authenticateFacebook, authenticateGoogle } from '../../../utils/passport'
import { USER_IS_EXIST, USER_NOT_FOUND, WRONG_CREDENTIALS } from '../../../enums/states/error'
import { ENTITY, INDIVIDUAL, OFICIAL, USER } from '../../../enums/types/account'
import { PURPOSE_ARTICLE, PURPOSE_PROJECT } from '../../../enums/settings/role'
import { INVITE, MESSAGE } from '../../../enums/types/notice'
import { UNREADED } from '../../../enums/states/message'
import { PERSONAL } from '../../../enums/types/chat'
import { OPENED } from '../../../enums/states/chat'
import * as M from '../../../enums/states/activity'
import * as T from '../../../enums/types/entity'
import template from '../../../utils/templates'
import {
  getDocuments,
  createNotice,
  createDashboardActivity,
  parseToQueryUser,
  parseToQueryDate,
  sendMail
} from '../../../utils/functions'

const SALT = config.get('salt')
const SECRET = config.get('secret')
const HOST_EMAIL = config.get('host-email')

export default {
  Query: {
    getUsers: async (_, args, { models: { UserModel, RoleModel } }) => {
      try {
        const createdAt = parseToQueryDate(args.createdAt)
        const company = await parseToQueryUser(args.company, 'company')

        const roleOne = args.role && (await RoleModel.findOne({ name: args.role }))
        const role = args.role && roleOne ? { role: roleOne.id } : {}

        const email = args.email ? { email: { $nin: args.email } } : {}
        const account = { account: args?.account || [INDIVIDUAL, OFICIAL, ENTITY] }
        const search = args.search
          ? {
              $or: [
                { name: { $regex: args.search, $options: 'i' } },
                { about: { $regex: args.search, $options: 'i' } }
              ]
            }
          : {}
        const sort = args.sort ? { [args.sort]: 1 } : { createdAt: -1 }
        const find = { ...email, ...company, ...role, ...account, ...createdAt, ...search }

        return await getDocuments(UserModel, {
          find,
          sort,
          skip: args.offset,
          limit: args.limit
        })
      } catch (err) {
        throw new Error(err)
      }
    },
    getUser: async (_, { email }, { user, models: { UserModel } }) => {
      try {
        if (email) {
          return UserModel.findOne({ email })
        }

        if (user) return user

        return null
      } catch (err) {
        throw new Error(err)
      }
    },
    getUserChats: async (_, args, { user, models: { UserChatModel } }) => {
      if (!user) return []
      const userChats = await UserChatModel.find({ user: user.id, status: OPENED })
      if (userChats) return userChats
      return []
    },
    getUserMembers: async (_, args, { models: { UserModel } }) => {
      const user = await UserModel.findOne({ email: args.email })

      if (user) {
        const sort = args.sort ? { [args.sort]: 1 } : { createdAt: -1 }
        return getDocuments(UserModel, {
          find: { company: user.id },
          sort,
          skip: args.offset,
          limit: args.limit
        })
      }

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

            sendMail({
              from: HOST_EMAIL,
              to: email,
              subject: template.registrationCompletedSubject,
              html: template.registrationCompleted({ name })
            })

            return {
              ...newUser._doc,
              register: true,
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

            sendMail({
              from: HOST_EMAIL,
              to: email,
              subject: template.googleAuthSubject,
              html: template.googleAuth({ name: user.name })
            })

            return {
              ...newUser._doc,
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

            sendMail({
              from: HOST_EMAIL,
              to: email,
              subject: template.registrationCompletedSubject,
              html: template.registrationCompleted({ name })
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

            sendMail({
              from: HOST_EMAIL,
              to: email,
              subject: template.facebookAuthSubject,
              html: template.facebookAuth({ name: user.name })
            })

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

      const user = await UserModel.findOne({ $or: [{ email }, { phone }] })
      if (user) {
        throw new UserInputError(USER_IS_EXIST)
      }

      const role = await RoleModel.findOne({ name: USER })

      if (role) {
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

        sendMail({
          from: HOST_EMAIL,
          to: email,
          subject: template.registrationCompletedSubject,
          html: template.registrationCompleted({ name })
        })

        return {
          ...newUser._doc,
          token: jwt.sign({ uid: newUser._id }, SECRET)
        }
      }

      throw new UserInputError('Errors', { errors })
    },
    createUser: async (
      _,
      { input },
      { user: author, createUpload, models: { UserModel, ImageModel } }
    ) => {
      const candidate = await UserModel.findOne({
        $or: [{ email: input.email }, { phone: input.phone }]
      })

      if (!candidate) {
        const user = new UserModel({
          ...input
        })

        await createDashboardActivity({
          user: author.id,
          message: M.CREATE_USER,
          entityType: T.USER,
          identityString: user.email
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

      if (input.avatar && input.avatarSize) {
        await deleteUpload(user.avatar, ImageModel)
        const avatar = await createUpload(input.avatar, input.avatarSize, ImageModel)
        if (avatar) user.avatar = avatar
      }

      await user.save()

      return user
    },
    updateUserPasswordResetStatus: async (_, { email }, { models: { UserModel } }) => {
      const user = await UserModel.findOne({ email })
      user.resetPasswordKey = randomString(6)
      await user.save()

      sendMail({
        from: HOST_EMAIL,
        to: email,
        subject: template.resetPasswordSubject,
        html: template.resetPassword({ key: user.resetPasswordKey })
      })

      return { email: user.email, resetPasswordKey: user.resetPasswordKey }
    },
    getResetTokenByEmail: async (_, { email, token }, { models: { UserModel } }) => {
      const user = await UserModel.findOne({ email })
      return user.resetPasswordKey === token
    },
    checkTokenAndResetPassword: async (
      _,
      { email, token, password },
      { models: { UserModel } }
    ) => {
      const user = await UserModel.findOne({ email })

      if (user.resetPasswordKey === token) {
        user.password = await bcrypt.hashSync(password, SALT)
        await user.save()
        return { email }
      }

      return { email: '' }
    },
    updateUser: async (
      _,
      { email, input },
      { user: author, deleteUpload, createUpload, models: { UserModel, ImageModel } }
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
        user.role = input.role || user.role

        if (input.password) {
          const bcryptPassword = await bcrypt.hashSync(input.password, SALT)
          user.password = bcryptPassword
        }

        if (input.company) {
          const company = await UserModel.findOne({ email: input.company })
          if (company && company.account === ENTITY) user.company = company.id
        }

        if (input.avatar && input.avatarSize) {
          await deleteUpload(user.avatar, ImageModel)
          const avatar = await createUpload(input.avatar, input.avatarSize, ImageModel)
          if (avatar) user.avatar = avatar
        }

        await createDashboardActivity({
          user: author.id,
          message: M.UPDATE_USER,
          entityType: T.USER,
          identityString: user.email
        })

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

        const message = await MessageModel.create({
          text,
          chat: chat.id,
          user: user.id,
          type: UNREADED
        })
        chat.messages = [...chat.messages, message.id]
        await chat.save()

        return await MessageModel.find({ chat: chat.id })
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
    removeUserProject: async (_, { project, folder }, { user }) => {
      if (user) {
        for (let item of user.folders) {
          if (item.id === folder) {
            user.folders = user.folders.map((f) =>
              f.id === folder
                ? {
                    ...f._doc,
                    projects: f.projects.filter((pr) => !pr.equals(project))
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
    inviteUserMember: async (_, { email }, { user, models: { UserModel } }) => {
      if (user.account === ENTITY) {
        const candidate = await UserModel.findOne({ email })

        if (candidate && candidate.account !== ENTITY) {
          const message = `${user.name} пригласила Вас к себе`

          await createNotice({
            type: INVITE,
            author: candidate.id,
            title: template.inviteUserMemberSubject,
            company: user.id,
            message
          })

          sendMail({
            from: HOST_EMAIL,
            to: email,
            subject: template.inviteUserMemberSubject,
            html: template.inviteUserMember({ message })
          })
        }
      }

      return true
    },
    applyInviteUserMember: async (
      _,
      { id, email },
      { user, models: { UserModel, NoticeModel } }
    ) => {
      if (user.account !== ENTITY) {
        const company = await UserModel.findOne({ email })

        if (company && company.account === ENTITY) {
          user.company = company.id
          await user.save()

          const notice = await NoticeModel.findById(id)
          notice.type = MESSAGE
          notice.title = 'Предложение принято'
          notice.message = `Вы приняли предложение ${company.name}`
          await notice.save()

          const message = `${user.name} принял Ваше предложение`

          await createNotice({
            type: MESSAGE,
            author: company.id,
            title: template.applyInviteUserMemberSubject,
            message
          })

          sendMail({
            from: HOST_EMAIL,
            to: company.email,
            subject: template.applyInviteUserMemberSubject,
            html: template.applyInviteUserMember({ message })
          })
        }
      }

      return NoticeModel.find({ author: user.id }).sort({ createdAt: -1 })
    },
    rejectInviteUserMember: async (
      _,
      { id, email },
      { user, models: { UserModel, NoticeModel } }
    ) => {
      if (user.account !== ENTITY) {
        const company = await UserModel.findOne({ email })

        if (company && company.account === ENTITY) {
          const notice = await NoticeModel.findById(id)
          notice.type = MESSAGE
          notice.title = 'Предложение отклонено'
          notice.message = `Вы отклонили предложение ${company.name}`
          await notice.save()

          const message = `${user.name} отклонил Ваше предложение`

          await createNotice({
            type: MESSAGE,
            author: company.id,
            title: template.rejectInviteUserMemberSubject,
            message
          })

          sendMail({
            from: HOST_EMAIL,
            to: company.email,
            subject: template.rejectInviteUserMemberSubject,
            html: template.rejectInviteUserMember({ message })
          })
        }
      }

      return NoticeModel.find({ author: user.id }).sort({ createdAt: -1 })
    },
    appointUserMember: async (_, { email }, { user, models: { UserModel, RoleModel } }) => {
      if (user.account === ENTITY) {
        const candidate = await UserModel.findOne({ email })

        if (candidate && candidate.account !== ENTITY) {
          const userRole = await RoleModel.findById(candidate.role)

          if (
            userRole &&
            userRole.permissions?.length > 0 &&
            !userRole.permissions.includes(PURPOSE_PROJECT) &&
            !userRole.permissions.includes(PURPOSE_ARTICLE)
          ) {
            const permissions = [...userRole.permissions, PURPOSE_PROJECT, PURPOSE_ARTICLE]
            const args = { name: `RESPONSIBLE ${userRole.name}`, permissions }
            const roleOne = await RoleModel.findOne({ permissions })
            const role = roleOne || (await RoleModel.create(args))

            candidate.role = role.id

            await candidate.save()

            const message = `Компания ${user.name} назначила Вас ответственным`

            await createNotice({
              type: MESSAGE,
              author: candidate.id,
              title: template.appointUserMemberSubject,
              message
            })

            sendMail({
              from: HOST_EMAIL,
              to: candidate.email,
              subject: template.appointUserMemberSubject,
              html: template.appointUserMember({ message })
            })
          }
        }
      }

      return UserModel.find({ company: user.id }).sort({ createdAt: -1 })
    },
    excludeUserMember: async (_, { email }, { user, models: { UserModel, RoleModel } }) => {
      if (user.account === ENTITY) {
        const candidate = await UserModel.findOne({ email })

        if (candidate && candidate.account !== ENTITY) {
          const userRole = await RoleModel.findById(candidate.role)

          if (
            userRole &&
            userRole.permissions?.length > 0 &&
            userRole.permissions.includes(PURPOSE_PROJECT) &&
            userRole.permissions.includes(PURPOSE_ARTICLE)
          ) {
            const permissions = userRole.permissions
              .filter((permission) => permission !== PURPOSE_PROJECT)
              .filter((permission) => permission !== PURPOSE_ARTICLE)
            const args = { name: userRole.name.replace('RESPONSIBLE ', ''), permissions }
            const roleOne = await RoleModel.findOne({ permissions })
            const role = roleOne || (await RoleModel.create(args))

            candidate.role = role.id

            await candidate.save()

            const message = `Компания ${user.name} сняла с Вас полномочия`

            await createNotice({
              type: MESSAGE,
              author: candidate.id,
              title: template.excludeUserMemberSubject,
              message
            })

            sendMail({
              from: HOST_EMAIL,
              to: candidate.email,
              subject: template.excludeUserMemberSubject,
              html: template.excludeUserMember({ message })
            })
          }
        }
      }

      return UserModel.find({ company: user.id }).sort({ createdAt: -1 })
    },
    dismissUserMember: async (_, { email }, { user, models: { UserModel } }) => {
      if (user.account === ENTITY) {
        const candidate = await UserModel.findOne({ email })

        if (candidate && candidate.account !== ENTITY) {
          candidate.company = null

          await candidate.save()

          const message = `Компания ${user.name} Вас исключила`

          await createNotice({
            type: MESSAGE,
            author: candidate.id,
            title: template.dismissUserMemberSubject,
            message
          })

          sendMail({
            from: HOST_EMAIL,
            to: candidate.email,
            subject: template.dismissUserMemberSubject,
            html: template.dismissUserMember({ message })
          })
        }
      }

      return UserModel.find({ company: user.id }).sort({ createdAt: -1 })
    },
    deleteUserFolder: async (_, { id }, { user }) => {
      if (user) {
        user.folders = user.folders.filter((folder) => folder.id !== id)
        await user.save()
      }

      return user?.folders || []
    },
    deleteUser: async (
      _,
      { email },
      { user: author, deleteUpload, models: { UserModel, ImageModel } }
    ) => {
      try {
        for (let str of email) {
          const user = await UserModel.findOne({ email: str })

          if (user) {
            if (author) {
              await createDashboardActivity({
                user: author.id,
                message: M.DELETE_USER,
                entityType: T.USER,
                identityString: user.email
              })

              deleteUpload(user.avatar, ImageModel)

              sendMail({
                from: HOST_EMAIL,
                to: user.email,
                subject: template.deleteUserSubject,
                html: template.deleteUser()
              })

              await user.delete()
            }
          }
        }

        return UserModel.find().sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
