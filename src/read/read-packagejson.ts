import { PackageJson } from '../types'
import { promises } from 'fs'

const { readFile } = promises

export const readPackageJson = async (path: string): Promise<PackageJson> => {
  try {
    const packageJsonFile = await readFile(path)
    return JSON.parse(packageJsonFile.toString())
  } catch (err) {
    throw new Error(`Could not get package.json for ${path}\n${err}`)
  }
}
