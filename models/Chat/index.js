import { Schema, model } from 'mongoose'
import TYPES from '../../enums/types/chat'

const ChatSchema = new Schema(
  {
    type: { type: String, enum: TYPES, required: true },
    title: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message', required: true }]
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('Chat', ChatSchema)
