import {parseMultiInput} from '@conventional-actions/toolkit'
import * as core from '@actions/core'
import * as glob from '@actions/glob'
import {getDefaultPlatformArch} from './utils'

type Config = {
  packages: string[]
  paths: string[]
  platforms: string[]
  tags: string[]
  buildvcs: string
  buildmode: string
  trimpath: boolean
}

export async function getConfig(): Promise<Config> {
  const packages = parseMultiInput(core.getInput('package') || './cmd/*')

  const pathsGlobber = await glob.create(packages.join('\n'), {
    matchDirectories: true,
    implicitDescendants: false
  })

  return {
    packages,
    paths: await pathsGlobber.glob(),
    platforms: parseMultiInput(
      core.getInput('platforms') || getDefaultPlatformArch()
    ),
    tags: parseMultiInput(core.getInput('tags') || ''),
    buildvcs: core.getInput('buildvcs') || 'auto',
    buildmode: core.getInput('buildmode') || 'default',
    trimpath: core.getInput('trimpath') !== 'false'
  }
}
