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

export default model('Notice', NoticeSchema)
