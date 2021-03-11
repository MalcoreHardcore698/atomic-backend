import { Schema, model } from 'mongoose'
import ENTITY_TYPES from '../../enums/types/entity'

const DashboardActivitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    entityType: { type: String, enum: ENTITY_TYPES, required: true },
    identityString: { type: String, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

DashboardActivitySchema.index({ user: 'text', message: 'text' })

export default model('DashboardActivity', DashboardActivitySchema)
