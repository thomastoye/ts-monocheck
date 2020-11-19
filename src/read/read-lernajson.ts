import { LernaJson } from '../types'
import { promises } from 'fs'

const { readFile } = promises

export const readLernaJson = async (path: string):  Promise<LernaJson> => {
  const file = await readFile(path)
  return JSON.parse(file.toString())
}
