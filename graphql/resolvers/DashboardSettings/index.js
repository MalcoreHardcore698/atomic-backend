import { createUpload, deleteUpload } from '../../../utils/functions'

export default {
  Query: {
    getDashboardSettings: async (_, args, { models: { DashboardSettingsModel } }) => {
      try {
        const settings = await DashboardSettingsModel.find()

        if (settings && settings[0]) return settings[0]
        else {
          return await DashboardSettingsModel.create({
            scaffold: {
              title: 'Создавай школу будущего с нами'
            },
            meta: {
              title: 'Atomic',
              description: 'Описание сайта'
            }
          })
        }
      } catch (err) {
        throw new Error(err)
      }
    }
  },
  Mutation: {
    createDashboardSettings: async (
      _,
      args,
      { storeUpload, models: { DashboardSettingsModel } }
    ) => {
      try {
        const logotype = await storeUpload(args.general.logotype)
        const background = await storeUpload(args.scaffold.background)

        const settings = new DashboardSettingsModel({
          general: {},
          scaffold: {
            title: args.scaffold.title,
            primary: args.scaffold.primary,
            residues: args.scaffold.residues,
            background: args.scaffold.background
          },
          meta: args.meta
        })

        if (logotype) settings.general.logotype = logotype
        if (background) settings.scaffold.background = background

        return await DashboardSettingsModel.create(args)
      } catch (err) {
        throw new Error(err)
      }
    },
    updateDashboardSettings: async (
      _,
      { input },
      { models: { DashboardSettingsModel, ImageModel } }
    ) => {
      try {
        const settingsList = await DashboardSettingsModel.find()
        const settings = settingsList[0]

        if (settings) {
          settings.scaffold.title = input.scaffold?.title || settings.scaffold?.title
          settings.scaffold.primary = input.scaffold?.primary || settings.scaffold?.primary
          settings.scaffold.residues = input.scaffold?.residues || settings.scaffold?.residues
          settings.scaffold.background = input.scaffold?.background || settings.scaffold?.background
          settings.meta.title = input.meta?.title || settings.meta?.title
          settings.meta.description = input.meta?.description || settings.meta?.description

          if (input.general.logotype && input.general.logotypeSize) {
            await deleteUpload(settings.general.logotype, ImageModel)
            const logotype = await createUpload(
              input.general.logotype,
              input.general.logotypeSize,
              ImageModel
            )
            if (logotype) settings.general.logotype = logotype
          }
          if (input.scaffold.background && input.scaffold.backgroundSize) {
            await deleteUpload(settings.scaffold.background, ImageModel)
            const background = await createUpload(
              input.scaffold.background,
              input.scaffold.backgroundSize,
              ImageModel
            )
            if (background) settings.scaffold.background = background
          }

          await settings.save()
        }

        return settings
      } catch (err) {
        throw new Error(err)
      }
    },
    deleteDashboardSettings: async (_, args, { models: { DashboardSettingsModel } }) => {
      try {
        const settingsList = await DashboardSettingsModel.find()
        const settings = settingsList[0]

        if (settings) await settings.delete()

        return true
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
