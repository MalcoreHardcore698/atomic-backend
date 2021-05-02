import { createDashboardActivity, getDocuments } from '../../../utils/functions'
import { ROLE_NOT_FOUND, ROLE_NOT_EMPTY } from '../../../enums/states/error'
import * as M from '../../../enums/states/activity'
import * as T from '../../../enums/types/entity'

export default {
  Query: {
    getRoles: async (_, args, { models: { RoleModel } }) => {
      try {
        const search = args.search ? { $text: { $search: args.search } } : {}
        const find = { ...search }

        return await getDocuments(RoleModel, {
          find,
          skip: args.offset,
          limit: args.limit
        })
      } catch (err) {
        throw new Error(err)
      }
    },
    getRole: async (_, { id }, { models: { RoleModel } }) => {
      try {
        const role = await RoleModel.findById(id)

        if (role) return role
        else return new Error(ROLE_NOT_FOUND)
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createRole: async (_, { input }, { user, models: { RoleModel } }) => {
      if (input.name.trim() === '') {
        throw new Error(ROLE_NOT_EMPTY)
      }

      const role = await RoleModel.create(input)

      await createDashboardActivity({
        user: user.id,
        message: M.CREATE_ROLE,
        entityType: T.ROLE,
        identityString: role._id.toString()
      })

      return await RoleModel.find().sort({ createdAt: -1 })
    },
    updateRole: async (_, { id, input }, { user, models: { RoleModel } }) => {
      if (input.name.trim() === '') {
        throw new Error(ROLE_NOT_EMPTY)
      }

      const role = await RoleModel.findById(id)

      await createDashboardActivity({
        user: user.id,
        message: M.UPDATE_ROLE,
        entityType: T.ROLE,
        identityString: role._id.toString()
      })

      if (role) {
        role.name = input.name || role.name
        role.permissions = input.permissions || role.permissions
        await role.save()
      }

      return await RoleModel.find().sort({ createdAt: -1 })
    },
    deleteRole: async (_, { id }, { user, models: { RoleModel } }) => {
      try {
        for (let str of id) {
          const role = await RoleModel.findById(str)

          if (role) {
            if (user) {
              const role = await RoleModel.findById(id)

              await createDashboardActivity({
                user: user.id,
                message: M.DELETE_ROLE,
                entityType: T.ROLE,
                identityString: role._id.toString()
              })

              await role.delete()
            }
          }
        }

        return await RoleModel.find().sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
