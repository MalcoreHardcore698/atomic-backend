import { Schema, model } from 'mongoose'
import TYPES from '../../enums/states/message'

const TicketMessageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    text: { type: String, required: true },
    type: { type: String, enum: TYPES, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

TicketMessageSchema.index({ text: 'text' })

export default model('TicketMessage', TicketMessageSchema)
