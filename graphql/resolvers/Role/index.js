import ERROR from '../../../enums/states/error'

export default {
  Query: {
    getRoles: async (_, args, { models: { RoleModel } }) => {
      try {
        if (args.search) {
          return await RoleModel.find({ $text: { $search: args.search } }).sort({
            createdAt: -1
          })
        }
        const roles = await RoleModel.find().sort({ createdAt: -1 })
        return roles
      } catch (err) {
        throw new Error(err)
      }
    },
    getRole: async (_, { id }, { models: { RoleModel } }) => {
      try {
        const role = await RoleModel.findById(id)
        if (role) {
          return role
        } else {
          throw new Error(ERROR.ROLE_NOT_FOUND)
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createRole: async (_, { input }, { models: { RoleModel } }) => {
      if (input.name.trim() === '') {
        throw new Error(ERROR.ROLE_NOT_EMPTY)
      }

      await RoleModel.create(input)

      return await RoleModel.find().sort({ createdAt: -1 })
    },
    updateRole: async (_, { id, input }, { models: { RoleModel } }) => {
      if (input.name.trim() === '') {
        throw new Error(ERROR.ROLE_NOT_EMPTY)
      }

      const role = await RoleModel.findById(id)

      if (role) {
        role.name = input.name || role.name
        role.permissions = input.permissions || role.permissions
        await role.save()
      }

      return await RoleModel.find().sort({ createdAt: -1 })
    },
    deleteRole: async (_, { id }, { models: { RoleModel } }) => {
      try {
        const role = await RoleModel.findById(id)
        await role.delete()
        return await RoleModel.find().sort({ createdAt: -1 })
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
