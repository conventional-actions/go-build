import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as exec from '@actions/exec'
import * as artifact from '@actions/artifact'
import {parseInputFiles, getDefaultPlatformArch} from './utils'
import path from 'path'
import fs from 'fs'

async function run(): Promise<void> {
  try {
    const packages = parseInputFiles(core.getInput('package') || './cmd/*')
    core.debug(`packages = ${packages}`)

    const pathsGlobber = await glob.create(packages.join('\n'), {
      matchDirectories: true,
      implicitDescendants: false
    })
    const paths = await pathsGlobber.glob()
    core.debug(`paths = ${paths}`)

    const platforms = parseInputFiles(
      core.getInput('platforms') || getDefaultPlatformArch()
    )
    core.debug(`platforms = ${platforms}`)

    const tags = parseInputFiles(core.getInput('tags') || '')
    core.debug(`tags = ${tags}`)

    const buildvcs = core.getInput('buildvcs') || 'auto'
    core.debug(`buildvcs = ${buildvcs}`)

    const buildmode = core.getInput('buildmode') || 'default'
    core.debug(`buildmode = ${buildmode}`)

    const trimpath = core.getInput('trimpath') !== 'false'
    core.debug(`trimpath = ${trimpath}`)

    let args = ['build']
    if (trimpath) {
      args = args.concat('-trimpath')
    }

    args = args.concat(`-buildmode=${buildmode}`)
    args = args.concat(`-buildvcs=${buildvcs}`)

    if (tags && tags.length) {
      args = args.concat('-tags', tags.join(','))
    }

    core.debug(`args = ${args}`)

    for (const platform of platforms) {
      core.debug(`platform = ${platform}`)

      const [osPlatform, osArch] = platform.split('/')

      for (let pkg of paths) {
        if (path.basename(pkg) === '...') {
          pkg = path.dirname(pkg)
        }

        const stat = fs.statSync(pkg.toString())
        if (stat.isFile()) {
          pkg = path.dirname(pkg)
        } else if (!stat.isDirectory()) {
          core.error(`path ${pkg} does not exist`)
          return
        }

        core.debug(`pkg = ${pkg}`)
        const binary = path.basename(pkg)

        core.debug(`binary = ${binary}`)

        const env = process.env as {[key: string]: string}
        env['GOOS'] = osPlatform
        env['GOARCH'] = osArch

        core.info(`Compiling ${pkg} to ${binary}`)

        await exec.exec(
          'go',
          args.concat('-o', `./.build/${osPlatform}-${osArch}/${binary}`, pkg),
          {
            env
          }
        )
      }
    }

    for (const platform of platforms) {
      core.debug(`platform = ${platform}`)

      const [osPlatform, osArch] = platform.split('/')

      const artifactsGlobber = await glob.create(
        `./.build/${osPlatform}-${osArch}/*`,
        {
          matchDirectories: true,
          implicitDescendants: false
        }
      )
      const artifacts = await artifactsGlobber.glob()
      core.debug(`artifacts = ${artifacts}`)

      for (const artifactPath of artifacts) {
        const filename = path.basename(artifactPath)

        const result = await artifact
          .create()
          .uploadArtifact(
            `${filename}_${osPlatform}_${osArch}`,
            [artifactPath],
            `./.build/${osPlatform}-${osArch}`,
            {
              continueOnError: false,
              retentionDays: 1
            }
          )
        core.info(result.artifactItems.join('\n'))
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
