export type LernaJson = {
    packages: readonly string[]
    version: string
}

export type PackageJson = {
    name: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
}

export type TsconfigJson = {
    extends?: string
    compilerOptions?: {
        composite?: boolean
    }
    references?: readonly { path: string }[]
}
