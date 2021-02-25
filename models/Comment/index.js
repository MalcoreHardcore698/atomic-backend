import { Schema, model } from 'mongoose'

const CommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    article: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    text: { type: String, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

CommentSchema.index({ text: 'text' })

export default model('Comment', CommentSchema)
