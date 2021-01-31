import { Schema, model } from 'mongoose'
import STATUS from '../../enums/types/post'

const ProjectSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    description: { type: String },
    company: { type: Schema.Types.ObjectId, ref: 'User' },
    preview: { type: Schema.Types.ObjectId, ref: 'Image' },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    presentation: { type: String },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    screenshots: [{ type: Schema.Types.ObjectId, ref: 'Image' }],
    files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    views: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    viewCount: { type: Number },
    rating: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    ratingCount: { type: Number },
    status: { type: String, enum: STATUS, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

export default model('Project', ProjectSchema)
