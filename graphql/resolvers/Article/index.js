import {
  createDashboardActivity,
  getValidDocuments,
  parseToQueryDate
} from '../../../utils/functions'
import { NEW_ARTICLE } from '../../../enums/types/events'
import { ARTICLE_NOT_FOUND, ARTICLE_NOT_EMPTY } from '../../../enums/states/error'
import { PUBLISHED } from '../../../enums/types/post'
import * as M from '../../../enums/states/activity'
import * as T from '../../../enums/types/entity'

export async function checkValidArticle({ UserModel }, article) {
  const author = await UserModel.findById(article.author)

  if (!author) {
    await article.delete()
    return false
  }

  return true
}

export async function getArticles({ ArticleModel, UserModel }, args) {
  return await getValidDocuments(ArticleModel, args, { UserModel }, checkValidArticle)
}

export default {
  Query: {
    getArticles: async (_, args, { models: { ArticleModel, UserModel } }) => {
      try {
        const createdAt = parseToQueryDate(args.createdAt)

        const authorOne = args.author && (await UserModel.findOne({ email: args.author }))
        const author = authorOne ? { author: authorOne.id } : {}

        const status = { status: args.status ?? PUBLISHED }
        const search = args.search
          ? {
              $or: [
                { title: { $regex: args.search, $options: 'i' } },
                { body: { $regex: args.search, $options: 'i' } }
              ]
            }
          : {}
        const category = args.category ? { category: args.category } : {}
        const sort = args.sort ? { [args.sort]: 1 } : { createdAt: -1 }
        const find = { ...status, ...category, ...author, ...createdAt, ...search }

        return await getArticles(
          { ArticleModel, UserModel },
          {
            find,
            sort,
            skip: args.offset,
            limit: args.limit
          }
        )
      } catch (err) {
        throw new Error(err)
      }
    },
    getArticle: async (_, { id }, { models: { ArticleModel, UserModel, CategoryModel } }) => {
      try {
        const article = await ArticleModel.findById(id)
        const candidate = await checkValidArticle({ UserModel, CategoryModel }, article)

        if (candidate) return article
        else return new Error(ARTICLE_NOT_FOUND)
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createArticle: async (
      _,
      { input, status },
      { user, pubsub, createUpload, models: { ArticleModel, ImageModel } }
    ) => {
      if (input.body.trim() === '') {
        throw new Error(ARTICLE_NOT_EMPTY)
      }

      const article = new ArticleModel({
        ...input,
        author: user.id,
        status: input.status || 'MODERATION'
      })

      const preview = await createUpload(input.preview, input.previewSize, ImageModel)
      if (preview) article.preview = preview

      await article.save()

      await createDashboardActivity({
        user: user.id,
        message: M.CREATE_ARTICLE,
        entityType: T.ARTICLE,
        identityString: article._id.toString()
      })

      await pubsub.publish(NEW_ARTICLE, {
        newArticle: article
      })

      const args = {}
      if (status) args.status = status
      return await ArticleModel.find(args).sort({ createdAt: -1 })
    },
    updateArticle: async (
      _,
      { id, input, status },
      { user, pubsub, deleteUpload, createUpload, models: { ArticleModel, ImageModel } }
    ) => {
      if (input.body.trim() === '') {
        throw new Error(ARTICLE_NOT_EMPTY)
      }

      const article = await ArticleModel.findById(id)

      if (article) {
        article.title = input.title || article.title
        article.body = input.body || article.body
        article.category = input.category || article.category
        article.status = input.status || article.status || 'MODERATION'

        await deleteUpload(article.preview, ImageModel)
        const preview = await createUpload(input.preview, input.previewSize, ImageModel)
        if (preview) article.preview = preview

        await article.save()

        await createDashboardActivity({
          user: user.id,
          message: M.UPDATE_ARTICLE,
          entityType: T.ARTICLE,
          identityString: article._id.toString()
        })

        await pubsub.publish(NEW_ARTICLE, {
          newArticle: article
        })
      }

      const args = {}
      if (status) args.status = status
      return await ArticleModel.find(args).sort({ createdAt: -1 })
    },
    deleteArticle: async (
      _,
      { id, status },
      { user, deleteUpload, models: { ArticleModel, ImageModel } }
    ) => {
      try {
        for (let str of id) {
          const article = await ArticleModel.findById(str)

          if (article) {
            if (user) {
              await deleteUpload(article.preview, ImageModel)

              await createDashboardActivity({
                user: user.id,
                message: M.DELETE_ARTICLE,
                entityType: T.ARTICLE,
                identityString: article._id.toString()
              })

              await article.delete()
            }
          }
        }

        const args = {}
        if (status) args.status = status
        return await ArticleModel.find(args).sort({ createdAt: -1 })
      } catch (err) {
        return new Error(err)
      }
    }
  },
  Subscription: {
    newArticle: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(NEW_ARTICLE)
    }
  }
}
