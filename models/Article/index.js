import { Schema, model } from 'mongoose'
import STATUS from '../../enums/types/post'

const ArticleSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    preview: { type: Schema.Types.ObjectId, ref: 'Image' },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    commentCount: { type: Number },
    views: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    viewCount: { type: Number },
    rating: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    ratingCount: { type: Number },
    status: { type: String, enum: STATUS, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('Article', ArticleSchema)
