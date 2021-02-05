import { Schema, model } from 'mongoose'
import TYPES from '../../enums/states/message'

const MessageSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    type: { type: String, enum: TYPES, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

MessageSchema.index({ text: 'text' })

export default model('Message', MessageSchema)
