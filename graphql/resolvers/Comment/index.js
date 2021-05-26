import { AuthenticationError, UserInputError } from 'apollo-server-express'
import { getValidDocuments } from '../../../utils/functions'
import {
  COMMENT_NOT_EMPTY,
  COMMENT_NOT_FOUND,
  ARTICLE_NOT_FOUND,
  ACTION_NOT_ALLOWED
} from '../../../enums/states/error'

export async function checkValidComment({ UserModel, ArticleModel }, comment) {
  const author = await UserModel.findById(comment.author)
  const article = await ArticleModel.findById(comment.article)

  if (!author || !article) {
    await comment.delete()
    return false
  }

  return true
}

export async function getComments({ CommentModel, UserModel, ArticleModel }, args) {
  return await getValidDocuments(CommentModel, args, { UserModel, ArticleModel }, checkValidComment)
}

export default {
  Query: {
    getComments: async (_, args, { models: { CommentModel, UserModel, ArticleModel } }) => {
      try {
        const search = args.search ? { text: { $regex: args.search, $options: 'i' } } : {}
        const find = { ...search, article: args.id }

        return await getComments(
          { CommentModel, UserModel, ArticleModel },
          {
            find,
            sort: { createdAt: 1 },
            skip: args.offset,
            limit: args.limit
          }
        )
      } catch (err) {
        return new Error(err)
      }
    }
  },
  Mutation: {
    sendComment: async (_, { article, text }, { user, models: { CommentModel, ArticleModel } }) => {
      if (text.trim() === '') {
        throw new UserInputError(COMMENT_NOT_EMPTY)
      }

      const candidate = await ArticleModel.findById(article)

      if (candidate) {
        const comment = await CommentModel.create({ author: user.id, article, text })
        candidate.comments = [...candidate.comments, comment.id]

        await candidate.save()

        return await CommentModel.find({ article }).sort({ createdAt: 1 })
      } else {
        throw new UserInputError(ARTICLE_NOT_FOUND)
      }
    },
    likeComment: async (
      _,
      { comment, likedUser, liked },
      { user, models: { UserModel, CommentModel } }
    ) => {
      const candidate = await CommentModel.findById(comment)
      const likedUserCandidate = await UserModel.findOne({ email: likedUser })

      if (candidate) {
        if (liked) {
          candidate.likes = [...candidate.likes, likedUserCandidate?.id || user.id]
        } else {
          candidate.likes = candidate.likes.filter(
            (id) => !id.equals(likedUserCandidate?.id || user.id)
          )
        }

        await candidate.save()

        return candidate
      } else {
        throw new UserInputError(COMMENT_NOT_FOUND)
      }
    },
    deleteComment: async (_, { postId, commentId }, { user, models: { ArticleModel } }) => {
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
