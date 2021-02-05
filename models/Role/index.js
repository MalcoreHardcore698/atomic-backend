import { Schema, model } from 'mongoose'
import PERMISSIONS from '../../enums/settings/role'

const RoleSchema = new Schema(
  {
    name: { type: String, required: true },
    permissions: [{ type: String, enum: PERMISSIONS }]
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

RoleSchema.index({ name: 'text' })

export default model('Role', RoleSchema)
