import globby from 'globby'
import { join } from 'path'
import { PackageDirectory } from './package-directory'
import { readLernaJson } from './read/read-lernajson'
import { readTsconfigJson } from './read/read-tsconfig'
import { LernaJson } from './types'

const getPackageDirs = async (repoRootDir: string, lernaJson: LernaJson): Promise<readonly PackageDirectory[]> => {
  const packages = lernaJson.packages

  const dirs = await Promise.all(packages.map(async (pkg) => {
      const expanded = await globby(pkg, {
          onlyDirectories: true
      })

      return expanded.map(dir => join(repoRootDir, dir))
  })).then(toFlatten => toFlatten.flat())

  return Promise.all(dirs.map(dir => PackageDirectory.createForPath(dir)))
}

export class TsMonorepoErrors {
  #errors = new Map<PackageDirectory, string[]>()

  addErrorForPackage(pkg: PackageDirectory, message: string) {
    if (!this.#errors.has(pkg)) {
      this.#errors.set(pkg, [])
    }

    this.#errors.get(pkg)!.push(message)
  }

  get errors(): ReadonlyMap<PackageDirectory, string[]> {
    return this.#errors
  }
}

export type TsMonorepoDiagnostics = {
  repoRootDir: string
  packageTsconfigLocation: string
  lernaJsonLocation: string
  packageDirs: readonly PackageDirectory[]
}

export const getErrors = async (repoRootDir: string): Promise<{ errors: TsMonorepoErrors, diagnostics: TsMonorepoDiagnostics }> => {
  const packageTsconfigLocation = join(repoRootDir, 'packages', 'tsconfig.json')
  const packageTsconfig = await readTsconfigJson(packageTsconfigLocation)
  const lernaJsonLocation = join(repoRootDir, 'lerna.json')
  const lernaJson = await readLernaJson(lernaJsonLocation)
  const packageDirs = await getPackageDirs(repoRootDir, lernaJson)

  const errors = new TsMonorepoErrors()

  packageDirs.map((packageDir) => {
      const tsconfig = packageDir.tsconfigJson

      if (!tsconfig.compilerOptions?.composite) {
          errors.addErrorForPackage(packageDir, 'Is not marked as composite in its tsconfig.json')
      }
  })

  packageDirs.map(packageDir => {
      if (!(packageTsconfig.references || []).map(reference => reference.path).includes(packageDir.directoryName)) {
          errors.addErrorForPackage(packageDir, `Not included in ${packageTsconfigLocation}'s references`)
      }
  })

  await Promise.all(packageDirs.map(async packageDir => {
      const unreferenced = await packageDir.findUnreferencedInternalDependencies(packageDirs)

      unreferenced.forEach(unreferencedPkg => errors.addErrorForPackage(packageDir, `Package depends on ${unreferencedPkg.directoryName}, but that package is not referenced in its tsconfig.json`))
  }))

  return {
    errors,
    diagnostics: {
      lernaJsonLocation,
      packageDirs,
      packageTsconfigLocation,
      repoRootDir
    }
  }
}
