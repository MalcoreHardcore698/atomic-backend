import { NEW_PROJECT } from '../../../enums/types/events'
import { PROJECT_NOT_FOUND, PROJECT_NOT_EMPTY } from '../../../enums/states/error'

export default {
  Query: {
    getProjects: async (_, args, { models: { ProjectModel, UserModel } }) => {
      try {
        if (args.offset >= 0 && args.limit >= 0) {
          return await ProjectModel.find()
            .sort({
              createdAt: -1
            })
            .skip(args.offset)
            .limit(args.limit)
        }
        if (args.search) {
          return await ProjectModel.find({ $text: { $search: args.search } }).sort({
            createdAt: -1
          })
        }
        if (args.author) {
          const user = await UserModel.findOne({ email: args.author })
          return await ProjectModel.find({ author: user.id }).sort({ createdAt: -1 })
        }
        if (args.member) {
          const user = await UserModel.findOne({ email: args.member })
          return await ProjectModel.find({
            $or: [{ members: { $elemMatch: { $eq: user.id } } }, { company: user.id }]
          }).sort({
            createdAt: -1
          })
        }
        return await ProjectModel.find().sort({ createdAt: -1 })
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
        if (project) {
          return project
        } else {
          return new Error(PROJECT_NOT_FOUND)
        }
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

      pubsub.publish(NEW_PROJECT, {
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

      if (project) {
        project.title = input.title || project.title
        project.body = input.body || project.body
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
          const preview = await createUpload(input.preview, input.previewSize, ImageModel)
          if (preview) {
            await deleteUpload(project.preview, ImageModel)
            project.preview = preview
          }
        }

        const files = await createUploads(
          input.files?.filter((f) => f),
          input.fileSizes,
          FileModel
        )

        const screenshots = await createUploads(
          input.screenshots?.filter((f) => f),
          input.screenshotSizes,
          ImageModel
        )

        if (files) project.files = files
        if (screenshots) project.screenshots = screenshots

        await project.save()

        pubsub.publish(NEW_PROJECT, {
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
      { deleteUpload, deleteUploads, models: { ProjectModel, ImageModel, FileModel } }
    ) => {
      try {
        const project = await ProjectModel.findById(id)

        await deleteUpload(project.preview, ImageModel)
        await deleteUploads(project.screenshots, ImageModel)
        await deleteUploads(project.files, FileModel)

        await project.delete()

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
            user.likedProjects = (user?.likedProjects || []).filter(
              (item) => String(item) !== String(candidate.id)
            )
          } else {
            candidate.rating = [...candidate.rating, user.id]
            user.likedProjects = [...(user?.likedProjects || []), candidate.id]
          }

          await candidate.save()
          await user.save()
        }

        return user
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
