import { CATEGORY_NOT_FOUND, CATEGORY_NOT_EMPTY } from '../../../enums/states/error'

export default {
  Query: {
    getCategories: async (_, args, { models: { CategoryModel } }) => {
      try {
        if (args.search) {
          return await CategoryModel.find({ $text: { $search: args.search } }).sort({
            createdAt: -1
          })
        }
        return await CategoryModel.find().sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    },
    getCategory: async (_, { id }, { models: { CategoryModel } }) => {
      try {
        const category = await CategoryModel.findById(id)
        if (category) {
          return category
        } else {
          return new Error(CATEGORY_NOT_FOUND)
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createCategory: async (_, { input }, { models: { CategoryModel } }) => {
      if (input.name.trim() === '') {
        throw new Error(CATEGORY_NOT_EMPTY)
      }

      await CategoryModel.create(input)

      return await CategoryModel.find().sort({ createdAt: -1 })
    },
    updateCategory: async (_, { id, input }, { models: { CategoryModel } }) => {
      if (input.name.trim() === '') {
        throw new Error(CATEGORY_NOT_EMPTY)
      }

      const category = await CategoryModel.findById(id)

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
      { models: { CategoryModel, ArticleModel, ProjectModel } }
    ) => {
      try {
        const category = await CategoryModel.findById(id)

        await ArticleModel.update({ category: id }, { $unset: { category: '' } })
        await ProjectModel.update({ category: id }, { $unset: { category: '' } })

        await category.delete()
        return await CategoryModel.find().sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
