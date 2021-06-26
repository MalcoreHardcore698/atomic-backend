import { Schema, model } from 'mongoose'

const DashboardSettingsSchema = new Schema(
  {
    general: {
      logotype: { type: Schema.Types.ObjectId, ref: 'Image' }
    },
    scaffold: {
      title: { type: String },
      primary: { type: Schema.Types.ObjectId, ref: 'Project' },
      residues: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
      background: { type: Schema.Types.ObjectId, ref: 'Image' },
      isRandom: { type: Boolean }
    },
    meta: {
      title: { type: String },
      description: { type: String }
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('DashboardSettings', DashboardSettingsSchema)
