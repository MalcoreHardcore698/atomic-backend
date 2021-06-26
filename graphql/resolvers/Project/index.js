import { NEW_PROJECT } from '../../../enums/types/events'
import { PROJECT_NOT_FOUND, PROJECT_NOT_EMPTY } from '../../../enums/states/error'
import {
  createDashboardActivity,
  getDocuments,
  parseToQueryUser,
  parseToQueryDate
} from '../../../utils/functions'
import { PUBLISHED } from '../../../enums/types/post'
import * as M from '../../../enums/states/activity'
import * as T from '../../../enums/types/entity'

export default {
  Query: {
    getProjects: async (_, args, { models: { ProjectModel, UserModel } }) => {
      try {
        const createdAt = parseToQueryDate(args.createdAt)
        const company = await parseToQueryUser(args.company, 'company')

        const authorOne = await UserModel.findOne({ email: args.author })
        const memberOne = await UserModel.findOne({ email: args.member })

        const status = { status: args.status ?? PUBLISHED }
        const author = authorOne ? { author: authorOne?.id } : {}
        const category = args.category ? { category: args.category } : {}
        const users = Array.isArray(args.rating) ? await UserModel.find({ email: args.rating }) : []
        const rating = args.rating && users.length > 0 ? { rating: users.map((u) => u.id) } : {}
        const search = args.search
          ? {
              $or: [
                { title: { $regex: args.search, $options: 'i' } },
                { description: { $regex: args.search, $options: 'i' } }
              ]
            }
          : {}
        const member = memberOne
          ? {
              $or: [{ members: { $elemMatch: { $eq: memberOne?.id } } }, { company: memberOne?.id }]
            }
          : {}

        const sort = args.sort ? { [args.sort]: 1 } : { createdAt: -1 }
        const find = {
          ...status,
          ...category,
          ...rating,
          ...member,
          ...author,
          ...company,
          ...createdAt,
          ...search
        }

        return getDocuments(ProjectModel, {
          find,
          sort,
          skip: args.offset,
          limit: args.limit
        })
      } catch (err) {
        throw new Error(err)
      }
    },
    getProjectsByIds: async (_, { projects }, { models: { ProjectModel } }) => {
      try {
        const result = []

        for (let id of projects) {
          const project = await ProjectModel.findById(id)
          result.push(project)
        }

        return result
      } catch (err) {
        throw new Error(err)
      }
    },
    getProject: async (_, { id }, { models: { ProjectModel } }) => {
      try {
        const project = await ProjectModel.findById(id)

        if (project) return project
        else return new Error(PROJECT_NOT_FOUND)
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createProject: async (
      _,
      { input, status },
      {
        user,
        pubsub,
        createUpload,
        createUploads,
        models: { UserModel, ProjectModel, FileModel, ImageModel }
      }
    ) => {
      if (input.title.trim() === '') {
        throw new Error(PROJECT_NOT_EMPTY)
      }

      const project = new ProjectModel({
        ...input,
        author: user.id,
        status: input.status || 'MODERATION'
      })

      await createDashboardActivity({
        user: user.id,
        message: M.CREATE_PROJECT,
        entityType: T.PROJECT,
        identityString: project._id.toString()
      })

      if (input.company) {
        const company = await UserModel.findOne({ email: input.company })
        if (company) project.company = company.id
      }

      if (input.members && input.members.length > 0) {
        const members = []
        for (let email of input.members) {
          const member = await UserModel.findOne({ email })
          if (member) members.push(member.id)
        }
        project.members = members
      }

      const preview = await createUpload(input.preview, input.previewSize, ImageModel)
      const files = await createUploads(input.files, input.fileSizes, FileModel)
      const screenshots = await createUploads(input.screenshots, input.screenshotSizes, ImageModel)

      if (preview) project.preview = preview
      if (files) project.files = files
      if (screenshots) project.screenshots = screenshots

      await project.save()

      await pubsub.publish(NEW_PROJECT, {
        newProject: project
      })

      const args = {}
      if (status) args.status = status
      return await ProjectModel.find(args).sort({ createdAt: -1 })
    },
    updateProject: async (
      _,
      { id, input, status },
      {
        user,
        pubsub,
        deleteUpload,
        createUpload,
        createUploads,
        models: { UserModel, ProjectModel, FileModel, ImageModel }
      }
    ) => {
      if (input.title.trim() === '') {
        throw new Error(PROJECT_NOT_EMPTY)
      }

      const project = await ProjectModel.findById(id)

      await createDashboardActivity({
        user: user.id,
        message: M.UPDATE_PROJECT,
        entityType: T.PROJECT,
        identityString: project._id.toString()
      })

      if (project) {
        project.title = input.title || project.title
        project.body = input.body || project.body
        project.characteristics = input.characteristics || project.characteristics
        project.description = input.description || project.description
        project.category = input.category || project.category
        project.presentation = input.presentation || project.presentation
        project.status = input.status || project.status || 'MODERATION'

        if (input.company) {
          const company = await UserModel.findOne({ email: input.company })
          if (company) project.company = company.id
        }

        if (input.members && input.members.length > 0) {
          const members = []
          for (let email of input.members) {
            const member = await UserModel.findOne({ email })
            if (member) members.push(member.id)
          }
          project.members = members
        }

        if (input.preview) {
          await deleteUpload(project.preview, ImageModel)
          const preview = await createUpload(input.preview, input.previewSize, ImageModel)
          if (preview) project.preview = preview
        }

        if (input.files) {
          const files = await createUploads(
            input.files?.filter((f) => f),
            input.fileSizes,
            FileModel
          )
          if (files) project.files = files
        }

        if (input.screenshots) {
          const screenshots = await createUploads(
            input.screenshots?.filter((f) => f),
            input.screenshotSizes,
            ImageModel
          )
          if (screenshots) project.screenshots = screenshots
        }

        await project.save()

        await pubsub.publish(NEW_PROJECT, {
          newProject: project
        })
      }

      const args = {}
      if (status) args.status = status
      return await ProjectModel.find(args).sort({ createdAt: -1 })
    },
    deleteProject: async (
      _,
      { id, status },
      { user, deleteUpload, deleteUploads, models: { ProjectModel, ImageModel, FileModel } }
    ) => {
      try {
        for (let str of id) {
          const project = await ProjectModel.findById(str)

          if (project) {
            if (user) {
              await createDashboardActivity({
                user: user.id,
                message: M.DELETE_PROJECT,
                entityType: T.PROJECT,
                identityString: project._id.toString()
              })

              await deleteUpload(project.preview, ImageModel)
              await deleteUploads(project.screenshots, ImageModel)
              await deleteUploads(project.files, FileModel)

              await project.delete()
            }
          }
        }

        const args = {}
        if (status) args.status = status
        return await ProjectModel.find(args).sort({ createdAt: -1 })
      } catch (err) {
        console.log(err)
        return []
      }
    },
    likeProject: async (_, { id }, { user, models: { ProjectModel } }) => {
      try {
        const candidate = await ProjectModel.findById(id)
        const isLiked = candidate.rating.find((item) => String(item) === String(user.id))

        if (candidate) {
          if (isLiked) {
            candidate.rating = candidate.rating.filter((item) => String(item) !== String(user.id))
          } else {
            candidate.rating = [...candidate.rating, user.id]
          }

          await candidate.save()
        }

        return await ProjectModel.find({ rating: user.id })
      } catch (err) {
        console.log(err)
        return user
      }
    }
  },
  Subscription: {
    newProject: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(NEW_PROJECT)
    }
  }
}
