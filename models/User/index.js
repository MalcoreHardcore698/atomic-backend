import { Schema, model } from 'mongoose'
import ACCOUNT_TYPES from '../../enums/types/account'
import GENDER_TYPES from '../../enums/types/gender'
import SETTINGS from '../../enums/settings/user'

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    about: { type: String },
    dateOfBirth: { type: String },
    account: { type: String, enum: ACCOUNT_TYPES, required: true },
    gender: { type: String, enum: GENDER_TYPES },
    password: {
      type: String,
      required: function () {
        const { googleAccount, facebookAccount } = this
        const isPasswordRequired = !!googleAccount.accessToken || !!facebookAccount.accessToken
        return !isPasswordRequired
      }
    },
    email: { type: String, required: true },
    phone: { type: String },
    resetPasswordKey: { type: String },
    folders: [
      {
        name: { type: String, required: true },
        projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }]
      }
    ],
    company: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    avatar: { type: Schema.Types.ObjectId, ref: 'File' },
    settings: [{ type: String, enum: SETTINGS }],
    googleAccount: {
      accessToken: { type: String }
    },
    facebookAccount: {
      accessToken: { type: String }
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
)

UserSchema.index({ name: 'text', email: 'text', phone: 'text', about: 'text' })

export default model('User', UserSchema)
