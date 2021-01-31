import { NEW_ARTICLE } from '../../../enums/types/events'
import { ARTICLE_NOT_FOUND, ARTICLE_NOT_EMPTY } from '../../../enums/states/error'

export default {
  Query: {
    getArticles: async (_, args, { models: { ArticleModel } }) => {
      try {
        if (args.search) {
          return await ArticleModel.find({ $text: { $search: args.search } }).sort({
            createdAt: -1
          })
        }
        return await ArticleModel.find(args).sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    },
    getArticle: async (_, { id }, { models: { ArticleModel } }) => {
      try {
        const article = await ArticleModel.findById(id)
        if (article) {
          return article
        } else {
          return new Error(ARTICLE_NOT_FOUND)
        }
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

      pubsub.publish(NEW_ARTICLE, {
        newArticle: article
      })

      const args = {}
      if (status) args.status = status
      return await ArticleModel.find(args).sort({ createdAt: -1 })
    },
    updateArticle: async (
      _,
      { id, input, status },
      { pubsub, deleteUpload, createUpload, models: { ArticleModel, ImageModel } }
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

        const preview = await createUpload(input.preview, input.previewSize, ImageModel)
        if (preview) {
          await deleteUpload(article.preview, ImageModel)
          article.preview = preview
        }

        await article.save()

        pubsub.publish(NEW_ARTICLE, {
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
      { deleteUpload, models: { ArticleModel, ImageModel } }
    ) => {
      try {
        const article = await ArticleModel.findById(id)

        await deleteUpload(article.preview, ImageModel)

        await article.delete()

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
