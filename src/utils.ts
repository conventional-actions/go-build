import os from 'os'
import * as core from '@actions/core'
import {Config} from './config'
import path from 'path'
import fs from 'fs'
import * as exec from '@actions/exec'

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

export async function goBuild(
  pkg: string,
  args: string[],
  platform: string,
  config: Config,
  output: boolean
): Promise<string> {
  const [osPlatform, osArch] = platform.split('/')

  core.debug(`path = ${pkg}`)

  let outputPath = ''
  if (output) {
    if (path.basename(pkg) === '...') {
      pkg = path.dirname(pkg)
    }

    const stat = fs.statSync(pkg.toString())
    if (stat.isFile()) {
      pkg = path.dirname(pkg)
    } else if (!stat.isDirectory()) {
      core.error(`path ${pkg} does not exist`)
      return ''
    }

    outputPath = `./.build/${osPlatform}-${osArch}/${path.basename(pkg)}`
    core.debug(`outputPath = ${outputPath}`)

    args = args.concat('-o', outputPath)
    core.info(`Compiling ${pkg} to ${outputPath}`)
  } else {
    core.info(`Compiling ${pkg}`)
  }

  const env = process.env as {[key: string]: string}
  env['GOOS'] = osPlatform
  env['GOARCH'] = osArch
  env['CGO_ENABLED'] = config.cgo_enabled ? '1' : '0'
  env['GOPRIVATE'] = config.goprivate
  env['GOPROXY'] = config.goproxy
  env['GOSUMDB'] = config.gosumdb

  await exec.exec('go', args.concat(pkg), {
    env
  })

  return outputPath
}
