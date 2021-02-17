import { Schema, model } from 'mongoose'
import STATUSES from '../../enums/states/chat'

const TicketSchema = new Schema(
  {
    title: { type: String, required: true },
    messages: [{ type: Schema.Types.ObjectId, ref: 'TicketMessage', required: true }],
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    counsellor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: STATUSES, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('Ticket', TicketSchema)
