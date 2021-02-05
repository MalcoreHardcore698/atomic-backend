import { Schema, model } from 'mongoose'

const NoticeSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

NoticeSchema.index({ title: 'text', message: 'text' })

export default model('Notice', NoticeSchema)
