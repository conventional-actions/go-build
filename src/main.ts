import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as exec from '@actions/exec'
import * as artifact from '@actions/artifact'
import path from 'path'
import {getConfig} from './config'
import {goBuild} from './utils'

async function run(): Promise<void> {
  try {
    const config = await getConfig()
    core.debug(`config = ${JSON.stringify(config)}`)

    await exec.exec('go', ['mod', 'download'])

    let args = ['build']
    if (config.trimpath) {
      args = args.concat('-trimpath')
    }

    args = args.concat(`-buildmode=${config.buildmode}`)
    args = args.concat(`-buildvcs=${config.buildvcs}`)
    args = args.concat(`-ldflags=${config.ldflags}`)

    if (config.tags && config.tags.length) {
      args = args.concat('-tags', config.tags.join(','))
    }

    core.debug(`args = ${args}`)
    let outputs: string[] = []

    for (const platform of config.platforms) {
      core.debug(`platform = ${platform}`)

      if (config.paths && config.paths.length) {
        for (const pkg of config.paths) {
          outputs = outputs.concat(
            await goBuild(pkg, args, platform, config, true)
          )
        }
      } else {
        for (const pkg of config.packages) {
          await goBuild(pkg, args, platform, config, false)
        }
      }
    }

    if (outputs && outputs.length) {
      core.setOutput('outputs', outputs.join(','))
    } else {
      return
    }

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

    if (outputArtifacts && outputArtifacts.length) {
      core.setOutput('artifacts', outputArtifacts.join(','))
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
