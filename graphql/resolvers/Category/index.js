import {getDocuments, createDashboardActivity, parseToQueryDate} from '../../../utils/functions'
import { CATEGORY_NOT_FOUND, CATEGORY_NOT_EMPTY } from '../../../enums/states/error'
import * as M from '../../../enums/states/activity'
import * as T from '../../../enums/types/entity'

export default {
  Query: {
    getCategories: async (_, args, { models: { CategoryModel } }) => {
      try {
        const createdAt = parseToQueryDate(args.createdAt)

        const search = args.search ? {
          $or: [
            { name: { $regex: args.search, $options: 'i' } },
            { description: { $regex: args.search, $options: 'i' } }
          ]
        } : {}
        const type = args.type ? { type: args.type } : {}
        const sort = args.sort ? { [args.sort]: 1 } : { createdAt: -1 }
        const find = { ...type, ...createdAt, ...search }

        return await getDocuments(CategoryModel, {
          find,
          sort,
          skip: args.offset,
          limit: args.limit
        })
      } catch (err) {
        throw new Error(err)
      }
    },
    getCategory: async (_, { id }, { models: { CategoryModel } }) => {
      try {
        const category = await CategoryModel.findById(id)

        if (category) return category
        else return new Error(CATEGORY_NOT_FOUND)
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createCategory: async (_, { input }, { user, models: { CategoryModel } }) => {
      if (input.name.trim() === '') {
        throw new Error(CATEGORY_NOT_EMPTY)
      }

      const category = await CategoryModel.create(input)

      await createDashboardActivity({
        user: user.id,
        message: M.CREATE_CATEGORY,
        entityType: T.CATEGORY,
        identityString: category._id.toString()
      })

      return await CategoryModel.find().sort({ createdAt: -1 })
    },
    updateCategory: async (_, { id, input }, { user, models: { CategoryModel } }) => {
      if (input.name.trim() === '') {
        throw new Error(CATEGORY_NOT_EMPTY)
      }

      const category = await CategoryModel.findById(id)

      await createDashboardActivity({
        user: user.id,
        message: M.UPDATE_CATEGORY,
        entityType: T.CATEGORY,
        identityString: category._id.toString()
      })

      if (category) {
        category.name = input.name || category.name
        category.type = input.type || category.type
        category.description = input.description || category.description
        await category.save()
      }

      return await CategoryModel.find().sort({ createdAt: -1 })
    },
    deleteCategory: async (
      _,
      { id },
      { user, models: { CategoryModel, ArticleModel, ProjectModel } }
    ) => {
      try {
        for (let str of id) {
          const category = await CategoryModel.findById(str)

          if (category) {
            if (user) {
              await createDashboardActivity({
                user: user.id,
                message: M.DELETE_CATEGORY,
                entityType: T.CATEGORY,
                identityString: category._id.toString()
              })

              await ArticleModel.update({ category: id }, { $unset: { category: '' } })
              await ProjectModel.update({ category: id }, { $unset: { category: '' } })

              await category.delete()
            }
          }
        }

        return await CategoryModel.find().sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
