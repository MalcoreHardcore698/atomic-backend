import { Schema, model } from 'mongoose'
import STATUS from '../../enums/states/chat'

const UserChatSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: STATUS, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('UserChat', UserChatSchema)
