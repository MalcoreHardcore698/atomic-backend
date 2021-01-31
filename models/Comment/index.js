import { Schema, model } from 'mongoose'

const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    article: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
    text: { type: String, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('Comment', CommentSchema)
