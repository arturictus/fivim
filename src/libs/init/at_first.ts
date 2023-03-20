import { AppMode } from '@/types'
import { useAppStore } from '@/pinia/modules/app'
import { CmdInvoke } from '@/libs/commands'
import { i18n } from '@/libs/init/i18n'
import { initWithConfFile, InitError } from '@/libs/init/conf_file'
import { initCoreDirs, initWorkDirs } from '@/libs/init/dirs'
import { runInTauri } from '@/utils/utils'
import { initStyle } from '@/libs/init/styles'
import { initEntryFile } from '@/libs/user_data/entry_file'
import { isMobileScreen } from '@/utils/media_query'

const initAppData = () => {
  const appStore = useAppStore()
  const appData = appStore.data
  if (runInTauri()) {
    appData.isWebPage = false
  } else {
    appData.isWebPage = true
  }

  if (isMobileScreen()) {
    appData.appMode = AppMode.Mobile
  } else {
    appData.appMode = AppMode.Desktop
  }

  appData.changeLocaleTimestamp = new Date().getTime()
  appStore.setData(appData) // save app data
  return appData
}

// Initialize other after configuration file initialization.
export const initAfterConfigFile = async () => {
  // CmdInvoke.closeSplashscreen()// close splashscreen

  await initWorkDirs()
  initAppData()
  initStyle()
  initEntryFile()
}

const failedCallback = (err: InitError) => {
  const t = i18n.global.t
  switch (err) {
    case InitError.noConfFile:
      console.log('initialization error: cannot find the configuration file.')
      CmdInvoke.notification(t('initialization error'), t('&cannot find conf file'), '')
      break
    case InitError.noSyncLockFileName:
      console.log('initialization error: &cannot find sync lock file')
      CmdInvoke.notification(t('initialization error'), t('&cannot find sync lock file'), '')
      break
  }
}

export const initAtFirst = async (pwdSha256: string) => {
  await initCoreDirs()
  return await initWithConfFile(pwdSha256, initAfterConfigFile, failedCallback)
}
