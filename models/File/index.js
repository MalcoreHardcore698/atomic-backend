import { Schema, model } from 'mongoose'

const FileSchema = new Schema(
  {
    path: { type: String, required: true },
    size: { type: Number, required: true },
    filename: { type: String, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('File', FileSchema)
