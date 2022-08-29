import * as glob from 'glob'
import {statSync} from 'fs'
import os from 'os'
import * as core from '@actions/core'

export const parseInputFiles = (files: string): string[] => {
  return files.split(/\r?\n/).reduce<string[]>(
    (acc, line) =>
      acc
        .concat(line.split(','))
        .filter(pat => pat)
        .map(pat => pat.trim()),
    []
  )
}

export const paths = (patterns: string[]): string[] => {
  return patterns.reduce((acc: string[], pattern: string): string[] => {
    return acc.concat(
      glob.sync(pattern).filter(path => statSync(path).isFile())
    )
  }, [])
}

export const unmatchedPatterns = (patterns: string[]): string[] => {
  return patterns.reduce((acc: string[], pattern: string): string[] => {
    return acc.concat(
      glob.sync(pattern).filter(path => statSync(path).isFile()).length === 0
        ? [pattern]
        : []
    )
  }, [])
}

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
