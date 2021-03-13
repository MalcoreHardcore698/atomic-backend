import { getDocumentGraph } from '../../utils/functions'

import Role from './Role'
import User from './User'
import File from './File'
import Image from './Image'
import Category from './Category'
import Article from './Article'
import Project from './Project'
import Comment from './Comment'
import Ticket from './Ticket'
import UserChat from './UserChat'
import Chat from './Chat'
import DashboardActivity from './DashboardActivity'
import DashboardSettings from './DashboardSettings'

import CHAT_TYPES from '../../enums/types/chat'
import STATUS_CHAT_TYPES from '../../enums/states/chat'
import CATEGORY_TYPES from '../../enums/types/category'
import ACCOUNT_TYPES, { USER } from '../../enums/types/account'
import ROLE_PERMISSIONS from '../../enums/settings/role'
import POST_STATUSES from '../../enums/types/post'

module.exports = {
  User: {
    projects: async ({ id }, args, { models: { ProjectModel } }) => {
      return await ProjectModel.find({ author: id }).sort({ createdAt: -1 })
    },
    articles: async ({ id }, args, { models: { ArticleModel } }) => {
      return await ArticleModel.find({ author: id }).sort({ createdAt: -1 })
    },
    likedProjects: async ({ id }, args, { models: { ProjectModel } }) => {
      return await ProjectModel.find({ rating: id }).sort({ createdAt: -1 })
    },
    avatar: async ({ avatar }, args, { models: { ImageModel } }) => {
      return await ImageModel.findById(avatar)
    },
    role: async ({ role }, args, { models: { RoleModel } }) => {
      const result = await RoleModel.findById(role)
      return result || USER
    },
    company: async ({ company }, args, { models: { UserModel } }) => {
      return await UserModel.findById(company)
    },
    notifications: async (parent, args, { user, models: { NoticeModel } }) => {
      const result = []

      if (!user) return result

      if (!user.notifications) {
        user.notifications = []
        await user.save()
      }

      for (let id of user.notifications) {
        const notification = await NoticeModel.findById(id)
        if (notification) result.push(notification)
      }

      return result
    },
    members: async ({ id }, args, { models: { UserModel } }) => {
      return await UserModel.countDocuments({ company: id })
    },
    folders: async ({ folders }, args, { models: { ProjectModel } }) => {
      const result = []

      if (folders && folders.length) {
        for (let folder of folders) {
          const projects = []

          if (folder) {
            for (let id of folder.projects) {
              const project = await ProjectModel.findById(id)
              if (project) projects.push(project)
            }
            result.push({
              id: folder.id,
              name: folder.name,
              projects
            })
          }
        }
      }

      return result
    }
  },
  Article: {
    author: async ({ author }, args, { models: { UserModel } }) => {
      return await UserModel.findById(author)
    },
    preview: async ({ preview }, args, { models: { ImageModel } }) => {
      return await ImageModel.findById(preview)
    },
    category: async ({ category }, args, { models: { CategoryModel } }) => {
      return await CategoryModel.findById(category)
    },
    commentCount: ({ comments }) => comments.length,
    viewsCount: ({ views }) => views.length,
    ratingCount: ({ rating }) => rating.length
  },
  Project: {
    author: async ({ author }, args, { models: { UserModel } }) => {
      return await UserModel.findById(author)
    },
    preview: async ({ preview }, args, { models: { ImageModel } }) => {
      return await ImageModel.findById(preview)
    },
    category: async ({ category }, args, { models: { CategoryModel } }) => {
      return await CategoryModel.findById(category)
    },
    company: async ({ company }, args, { models: { UserModel } }) => {
      return await UserModel.findById(company)
    },
    members: async ({ members }, args, { models: { UserModel } }) => {
      const results = []

      for (let id of members) {
        const member = await UserModel.findById(id)
        if (member) results.push(member)
      }

      return results
    },
    files: async ({ files }, args, { models: { FileModel } }) => {
      const results = []

      for (let id of files) {
        const file = await FileModel.findById(id)
        if (file) results.push(file)
      }

      return results
    },
    screenshots: async ({ screenshots }, args, { models: { ImageModel } }) => {
      const results = []

      for (let id of screenshots) {
        const screenshot = await ImageModel.findById(id)
        if (screenshot) results.push(screenshot)
      }

      return results
    },
    rating: async ({ rating }, args, { models: { UserModel } }) => {
      const users = []

      for (let id of rating) {
        const user = await UserModel.findById(id)
        if (user) users.push(user)
      }

      return users
    }
  },
  Notice: {
    author: async ({ author }, args, { models: { UserModel } }) => {
      return await UserModel.findById(author)
    }
  },
  UserChat: {
    chat: async ({ chat }, args, { models: { ChatModel } }) => {
      return await ChatModel.findById(chat)
    },
    user: async ({ user }, args, { models: { UserModel } }) => {
      return await UserModel.findById(user)
    }
  },
  Chat: {
    members: async ({ members }, args, { models: { UserModel } }) => {
      const users = []

      for (let id of members) {
        const user = await UserModel.findById(id)
        if (user) users.push(user)
      }

      return users
    },
    messages: async ({ messages }, args, { models: { MessageModel } }) => {
      const result = []

      for (let id of messages) {
        const message = await MessageModel.findById(id)
        if (message) result.push(message)
      }

      return result
    }
  },
  Message: {
    chat: async ({ chat }, args, { models: { ChatModel } }) => {
      return await ChatModel.findById(chat)
    },
    user: async ({ user }, args, { models: { UserModel } }) => {
      return await UserModel.findById(user)
    }
  },
  Comment: {
    author: async ({ author }, args, { models: { UserModel } }) => {
      return await UserModel.findById(author)
    },
    article: async ({ article }, args, { models: { ArticleModel } }) => {
      return await ArticleModel.findById(article)
    },
    likes: async ({ likes }, args, { models: { UserModel } }) => {
      const result = []

      for (let id of likes) {
        const user = await UserModel.findById(id)
        if (user) result.push(user)
      }

      return result
    }
  },
  TicketMessage: {
    ticket: async ({ ticket }, args, { models: { TicketModel } }) => {
      return await TicketModel.findById(ticket)
    },
    user: async ({ user }, args, { models: { UserModel } }) => {
      return await UserModel.findById(user)
    }
  },
  Ticket: {
    author: async ({ author }, args, { models: { UserModel } }) => {
      return await UserModel.findById(author)
    },
    counsellor: async ({ counsellor }, args, { models: { UserModel } }) => {
      return await UserModel.findById(counsellor)
    },
    category: async ({ category }, args, { models: { CategoryModel } }) => {
      return await CategoryModel.findById(category)
    },
    messages: async ({ messages }, args, { models: { TicketMessageModel } }) => {
      const result = []

      for (let id of messages) {
        const message = await TicketMessageModel.findById(id)
        if (message) result.push(message)
      }

      return result
    }
  },
  DashboardActivity: {
    user: async ({ user }, args, { models: { UserModel } }) => {
      return await UserModel.findById(user)
    }
  },
  DashboardSettings: {
    general: async ({ general }, args, { models: { ImageModel } }) => {
      const logotype = await ImageModel.findById(general.logotype)
      return { ...general, logotype }
    },
    scaffold: async ({ scaffold }, args, { models: { ProjectModel, ImageModel } }) => {
      const primary = await ProjectModel.findById(scaffold.primary)
      const background = await ImageModel.findById(scaffold.background)

      const residues = []
      for (let id of scaffold.residues) {
        const project = await ProjectModel.findById(id)
        if (project) residues.push(project)
      }

      return { ...scaffold, primary, residues, background }
    }
  },
  Query: {
    ...Role.Query,
    ...User.Query,
    ...File.Query,
    ...Image.Query,
    ...Category.Query,
    ...Comment.Query,
    ...Article.Query,
    ...Project.Query,
    ...Ticket.Query,
    ...UserChat.Query,
    ...Chat.Query,
    ...DashboardActivity.Query,
    ...DashboardSettings.Query,
    getChatTypes: () => CHAT_TYPES,
    getStatusChatTypes: () => STATUS_CHAT_TYPES,
    getCategoryTypes: () => CATEGORY_TYPES,
    getAccountTypes: () => ACCOUNT_TYPES,
    getPermissions: () => ROLE_PERMISSIONS,
    getPostStatus: () => POST_STATUSES,
    getDashboardStatistics: async (
      _,
      args,
      { models: { UserModel, ProjectModel, ArticleModel, CategoryModel } }
    ) => {
      const usersCount = await UserModel.estimatedDocumentCount()
      const usersGraph = await getDocumentGraph(UserModel)

      const projectsCount = await ProjectModel.estimatedDocumentCount()
      const projectsGraph = await getDocumentGraph(ProjectModel)

      const articlesCount = await ArticleModel.estimatedDocumentCount()
      const articlesGraph = await getDocumentGraph(ArticleModel)

      const categoriesCount = await CategoryModel.estimatedDocumentCount()
      const categoriesGraph = await getDocumentGraph(CategoryModel)

      return [
        {
          title: 'Пользователи',
          total: usersCount,
          graph: usersGraph
        },
        {
          title: 'Проекты',
          total: projectsCount,
          graph: projectsGraph
        },
        {
          title: 'Статьи',
          total: articlesCount,
          graph: articlesGraph
        },
        {
          title: 'Категории',
          total: categoriesCount,
          graph: categoriesGraph
        }
      ]
    }
  },
  Mutation: {
    ...Role.Mutation,
    ...User.Mutation,
    ...File.Mutation,
    ...Image.Mutation,
    ...Category.Mutation,
    ...Article.Mutation,
    ...Project.Mutation,
    ...Comment.Mutation,
    ...Ticket.Mutation,
    ...UserChat.Mutation,
    ...Chat.Mutation,
    ...DashboardActivity.Mutation,
    ...DashboardSettings.Mutation
  },
  Subscription: {
    ...Article.Subscription,
    ...Project.Subscription
  }
}
