import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as exec from '@actions/exec'
import {DefaultArtifactClient} from '@actions/artifact'
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

    const artifactClient = new DefaultArtifactClient()
    const uploadedArtifactIds: number[] = []

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
      const artifactPaths = await artifactsGlobber.glob()
      core.debug(`artifacts = ${artifactPaths}`)

      for (const artifactPath of artifactPaths) {
        const filename = path.basename(artifactPath)

        const result = await artifactClient.uploadArtifact(
          `${filename}-${osPlatform}-${osArch}`,
          [artifactPath],
          `./.build/${osPlatform}-${osArch}`,
          {
            retentionDays: 1
          }
        )
        if (result.id) {
          uploadedArtifactIds.push(result.id)
        }
      }
    }

    if (uploadedArtifactIds.length) {
      core.setOutput('artifacts', uploadedArtifactIds.join(','))
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
