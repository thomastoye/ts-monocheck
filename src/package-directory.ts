import { PackageJson, TsconfigJson } from './types'
import { join, normalize, parse, relative } from 'path'
import { readPackageJson } from './read/read-packagejson'
import { readTsconfigJson } from './read/read-tsconfig'

/** Represents a directory holding one package in the lerna monorepo */
export class PackageDirectory {
    #path: string
    #packageJson: PackageJson
    #tsconfigJson: TsconfigJson

    private static packageDirs: PackageDirectory[] = []

    private constructor(path: string, packageJson: PackageJson, tsconfigJson: TsconfigJson) {
        this.#path = path
        this.#packageJson = packageJson
        this.#tsconfigJson = tsconfigJson
    }

    static async createForPath(path: string): Promise<PackageDirectory> {
        const parsedPath = parse(normalize(path))
        const normalizedPath = join(parsedPath.dir, parsedPath.base)

        const existing = this.packageDirs.find(dir => dir.path === normalizedPath)

        if (existing != null) {
            return existing
        }

        const packageJson = await readPackageJson(join(normalizedPath, 'package.json'))
        const tsconfigJson = await readTsconfigJson(join(normalizedPath, 'tsconfig.json'))
        const dir = new PackageDirectory(normalizedPath, packageJson, tsconfigJson)
        this.packageDirs.push(dir)
        return dir
    }

    get packageJson(): PackageJson {
        return this.#packageJson
    }

    get name(): string {
        return this.packageJson.name
    }

    get tsconfigJson(): TsconfigJson {
        return this.#tsconfigJson
    }

    get path(): string {
        return this.#path
    }

    get directoryName(): string {
        return parse(this.path).base
    }

    findDependencies(packagesInMonorepo: readonly PackageDirectory[]): readonly PackageDirectory[] {
        const mapped = packagesInMonorepo.map(packageDir => {
            return { isDependency: this.isDependencyOfMine(packageDir), packageDir }
        })

        return mapped.filter(obj => obj.isDependency).map(obj => obj.packageDir)
    }

    async findUnreferencedDependencies(packagesInMonorepo: readonly PackageDirectory[]): Promise<PackageDirectory[]> {
        const deps = this.findDependencies(packagesInMonorepo)

        const mapped = await Promise.all(deps.map(dep => {
            return { isReferenced: this.isReferencedInMyTsconfig(dep), packageDir: dep }
        }))

        return mapped.filter(dep => dep.isReferenced).map(dep => dep.packageDir)
    }

    async isReferencedInMyTsconfig(pkg: PackageDirectory): Promise<boolean> {
        return (await this.referencedPackagesInMyTsconfig()).includes(pkg)
    }

    referencedPackagesInMyTsconfig(): Promise<readonly PackageDirectory[]> {
        const references = (this.tsconfigJson.references || []).map(reference => join(this.path, reference.path))

        return Promise.all(references.map(reference => PackageDirectory.createForPath(reference)))
    }

    isDependencyOfMine(possibleDependency: PackageDirectory): boolean {
        const allMyDependencies = [
            ...Object.keys(this.packageJson.dependencies || {}),
            ...Object.keys(this.packageJson.devDependencies || {})
        ]

        return allMyDependencies.includes(possibleDependency.packageJson.name)
    }

    equals(other: PackageDirectory): boolean {
        return this.path === other.path
    }

    pathRelativeToMonorepoRoot(monorepoRoot: string): string {
        return relative(monorepoRoot, this.path)
    }
}
