import { Schema, model } from 'mongoose'

const LanguageSchema = new Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('Language', LanguageSchema)
