import os from 'os'
import * as core from '@actions/core'

export const getDefaultPlatformArch = (): string => {
  let osPlatform: string = os.platform()
  switch (osPlatform) {
    case 'win32':
      osPlatform = 'windows'
      break

    case 'sunos':
      osPlatform = 'solaris'
      break
  }
  core.debug(`osPlatform = ${osPlatform}`)

  let osArch: string = os.arch()
  if (osArch === 'x64') {
    osArch = 'amd64'
  }
  core.debug(`osArch = ${osArch}`)

  return `${osPlatform}/${osArch}`
}
