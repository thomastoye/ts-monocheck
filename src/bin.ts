#!/usr/bin/env node

import { getErrors } from './get-errors'
import { reportErrorsToConsole } from './report-errors-to-console'

(async () => {
  // Tool is assumed to be invoked in the root directory of the lerna monorepo
  const repoRootDir = process.cwd()

  const { errors, diagnostics } = await getErrors(repoRootDir)

  if (errors.errors.size === 0) {
    process.exit(0)
  }

  reportErrorsToConsole(errors, diagnostics)
  process.exit(1)
})()
