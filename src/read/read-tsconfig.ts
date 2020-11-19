import { TsconfigJson } from '../types'
import { promises } from 'fs'
import json5 from 'json5'

const { readFile } = promises

export const readTsconfigJson = async (path: string): Promise<TsconfigJson> => {
    try {
        const tsconfig = await readFile(path)
        return json5.parse(tsconfig.toString())
    } catch (err) {
        throw new Error(`Could not get tsconfig.json for ${path}\n${err}`)
    }
}
