import type { UserModule } from '~/types'

// https://github.com/antfu/vite-plugin-pwa#automatic-reload-when-new-content-available
export const install: UserModule = async ({ app, isClient }) => {
  if (!isClient)
    return

  const { installPwa } = await import('../composables/pwa')

  installPwa(app)
}
