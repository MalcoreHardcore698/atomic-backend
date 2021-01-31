import { AuthenticationError, UserInputError } from 'apollo-server-express'
import {
  COMMENT_NOT_EMPTY,
  ARTICLE_NOT_FOUND,
  ACTION_NOT_ALLOWED
} from '../../../enums/states/error'

export default {
  Query: {
    getComments: async (_, args, { models: CommentModel, ArticleModel }) => {
      if (args.search) {
        return await CommentModel.find({ $text: { $search: args.search } }).sort({
          createdAt: -1
        })
      }
      const article = await ArticleModel.findById(args.id)
      if (article) {
        return await CommentModel.find({ article: article.id })
      }
    }
  },
  Mutation: {
    createComment: async (_, { postId, body }, { user, models: ArticleModel }) => {
      if (body.trim() === '') {
        throw new UserInputError(COMMENT_NOT_EMPTY)
      }

      const article = await ArticleModel.findById(postId)

      if (article) {
        article.comments.unshift({
          body,
          user,
          createdAt: new Date().toISOString()
        })

        await article.save()

        return article
      } else throw new UserInputError(ARTICLE_NOT_FOUND)
    },
    deleteComment: async (_, { postId, commentId }, { user, models: ArticleModel }) => {
      const article = await ArticleModel.findById(postId)

      if (article) {
        const commentIndex = article.comments.findIndex((c) => c.id === commentId)

        if (article.comments[commentIndex].user === user) {
          article.comments.splice(commentIndex, 1)
          await article.save()

          return article
        } else {
          throw new AuthenticationError(ACTION_NOT_ALLOWED)
        }
      } else {
        throw new UserInputError(ARTICLE_NOT_FOUND)
      }
    }
  }
}
