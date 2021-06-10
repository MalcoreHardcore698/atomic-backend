import { Schema, model } from 'mongoose'
import NOTICE_TYPES from '../../enums/types/notice'
import TYPES from '../../enums/states/message'

const NoticeSchema = new Schema(
  {
    type: { type: String, enum: NOTICE_TYPES, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: TYPES, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

NoticeSchema.index({ title: 'text', message: 'text' })

export default model('Notice', NoticeSchema)
