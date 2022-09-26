import {parseMultiInput} from '@conventional-actions/toolkit'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import fs from 'fs';
import {getDefaultPlatformArch} from './utils'

export type Config = {
  packages: string[]
  paths: string[]
  platforms: string[]
  tags: string[]
  buildvcs: string
  buildmode: string
  trimpath: boolean
  cgo_enabled: boolean
  ldflags: string
  goprivate: string
  goproxy: string
  gosumdb: string
}

export async function getConfig(): Promise<Config> {
  let packageInput = core.getInput('package');
  if (packageInput.length === 0) {
    if (fs.existsSync('./cmd')) {
      packageInput = './cmd/*';
    } else {
      packageInput = './...';
    }
  }
  const packages = parseMultiInput(packageInput)
  core.debug(`packages = ${packages}`)

  const pathsGlobber = await glob.create(packages.join('\n'), {
    matchDirectories: true,
    implicitDescendants: false
  })

  const paths = await pathsGlobber.glob()
  core.debug(`paths = ${paths}`)

  return {
    packages,
    paths,
    platforms: parseMultiInput(
      core.getInput('platforms') || getDefaultPlatformArch()
    ),
    tags: parseMultiInput(core.getInput('tags') || ''),
    buildvcs: core.getInput('buildvcs') || 'auto',
    buildmode: core.getInput('buildmode') || 'default',
    trimpath: core.getInput('trimpath') !== 'false',
    cgo_enabled:
      core.getInput('cgo-enabled') === 'true' ||
      process.env['CGO_ENABLED'] === '1',
    ldflags:
      core.getInput('ldflags') || process.env['GO_LDFLAGS'] || '-d -s -w',
    goprivate: core.getInput('goprivate') || process.env['GOPRIVATE'] || '',
    goproxy: core.getInput('goproxy') || process.env['GOPROXY'] || 'direct',
    gosumdb: core.getInput('gosumdb') || process.env['GOSUMDB'] || 'off'
  }
}
