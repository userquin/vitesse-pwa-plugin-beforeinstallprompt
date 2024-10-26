import { useRegisterSW } from 'virtual:pwa-register/vue'

export interface UserChoice {
  outcome: 'accepted' | 'dismissed'
  platform: string
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => void
  userChoice: Promise<UserChoice>
}

export interface InstallPwaOptions {
  /**
   * @default 'vite-pwa:hide-install'
   */
  installPrompt?: string
  /**
   * @default 0
   */
  periodicSyncForUpdates?: number
  /**
   * @default 'standalone'
   */
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
}

export function installPwa(options: InstallPwaOptions = {}) {
  const {
    installPrompt = 'vite-pwa:hide-install',
    display = 'standalone',
    periodicSyncForUpdates = 0,
  } = options

  const registrationError = ref(false)
  const swActivated = ref(false)
  const showInstallPrompt = ref(false)
  const hideInstall = ref(!installPrompt ? true : localStorage.getItem(installPrompt) === 'true')

  // https://thomashunter.name/posts/2021-12-11-detecting-if-pwa-twa-is-installed
  const ua = navigator.userAgent
  const ios = ua.match(/iPhone|iPad|iPod/)
  const useDisplay = display === 'standalone' || display === 'minimal-ui' ? `${display}` : 'standalone'
  const standalone = window.matchMedia(`(display-mode: ${useDisplay})`).matches
  const isInstalled = ref(!!(standalone || (ios && !ua.match(/Safari/))))
  const isPWAInstalled = ref(isInstalled.value)

  window.matchMedia(`(display-mode: ${useDisplay})`).addEventListener('change', (e) => {
    // PWA on fullscreen mode will not match standalone nor minimal-ui
    if (!isPWAInstalled.value && e.matches)
      isPWAInstalled.value = true
  })

  let swRegistration: ServiceWorkerRegistration | undefined

  const getSWRegistration = () => swRegistration

  const registerPeriodicSync = (swUrl: string, r: ServiceWorkerRegistration, timeout: number) => {
    setInterval(async () => {
      if (('connection' in navigator) && !navigator.onLine)
        return

      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: {
          'cache': 'no-store',
          'cache-control': 'no-cache',
        },
      })

      if (resp?.status === 200)
        await r.update()
    }, timeout)
  }

  const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError() {
      registrationError.value = true
    },
    onRegisteredSW(swUrl, r) {
      swRegistration = r
      const timeout = periodicSyncForUpdates
      if (timeout > 0) {
        // should add support in pwa plugin
        if (r?.active?.state === 'activated') {
          swActivated.value = true
          registerPeriodicSync(swUrl, r, timeout * 1000)
        }
        else if (r?.installing) {
          r.installing.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker
            swActivated.value = sw.state === 'activated'
            if (swActivated.value)
              registerPeriodicSync(swUrl, r, timeout * 1000)
          })
        }
      }
    },
  })

  const cancelPrompt = async () => {
    offlineReady.value = false
    needRefresh.value = false
  }

  let install: () => Promise<UserChoice | undefined> = () => Promise.resolve(undefined)
  let cancelInstall: () => void = () => {}

  if (!hideInstall.value) {
    let deferredPrompt: BeforeInstallPromptEvent | undefined

    const beforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      showInstallPrompt.value = true
    }
    window.addEventListener('beforeinstallprompt', beforeInstallPrompt)
    window.addEventListener('appinstalled', () => {
      deferredPrompt = undefined
      showInstallPrompt.value = false
    })

    cancelInstall = () => {
      deferredPrompt = undefined
      showInstallPrompt.value = false
      window.removeEventListener('beforeinstallprompt', beforeInstallPrompt)
      hideInstall.value = true
      localStorage.setItem(installPrompt!, 'true')
    }

    install = async () => {
      if (!showInstallPrompt.value || !deferredPrompt) {
        showInstallPrompt.value = false
        return undefined
      }

      showInstallPrompt.value = false
      await nextTick()
      deferredPrompt.prompt()
      return await deferredPrompt.userChoice
    }
  }

  return {
    registrationError,
    swActivated,
    showInstallPrompt,
    hideInstall,
    isInstalled,
    isPWAInstalled,
    offlineReady,
    needRefresh,
    updateServiceWorker,
    getSWRegistration,
    cancelPrompt,
    install,
    cancelInstall,
  }
}
