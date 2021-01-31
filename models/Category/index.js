import { Schema, model } from 'mongoose'
import CATEGORY_TYPES from '../../enums/types/category'

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: CATEGORY_TYPES, required: true },
    description: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('Category', CategorySchema)
