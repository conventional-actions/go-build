import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as exec from '@actions/exec'
import * as artifact from '@actions/artifact'
import path from 'path'
import fs from 'fs'
import {getConfig} from './config'

async function run(): Promise<void> {
  try {
    const config = await getConfig()

    let args = ['build']
    if (config.trimpath) {
      args = args.concat('-trimpath')
    }

    args = args.concat(`-buildmode=${config.buildmode}`)
    args = args.concat(`-buildvcs=${config.buildvcs}`)

    if (config.tags && config.tags.length) {
      args = args.concat('-tags', config.tags.join(','))
    }

    core.debug(`args = ${args}`)
    let outputs: string[] = []

    for (const platform of config.platforms) {
      core.debug(`platform = ${platform}`)

      const [osPlatform, osArch] = platform.split('/')

      for (let pkg of config.paths) {
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

        outputs = outputs.concat(`./.build/${osPlatform}-${osArch}/${binary}`)

        await exec.exec(
          'go',
          args.concat('-o', `./.build/${osPlatform}-${osArch}/${binary}`, pkg),
          {
            env
          }
        )
      }
    }

    core.setOutput('outputs', outputs.join(','))

    let outputArtifacts: string[] = []

    for (const platform of config.platforms) {
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
        outputArtifacts = artifacts.concat(result.artifactItems)
      }
    }

    core.setOutput('artifacts', outputArtifacts.join(','))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
