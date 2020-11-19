import chalk from 'chalk'
import { TsMonorepoDiagnostics, TsMonorepoErrors } from './get-errors'

export const reportErrorsToConsole = (errors: TsMonorepoErrors, diagnostics: TsMonorepoDiagnostics): void => {
  console.log(chalk.gray(`Monorepo root        ${diagnostics.repoRootDir}`))
  console.log(chalk.gray(`lerna.json           ${diagnostics.lernaJsonLocation}`))
  console.log(chalk.gray(`Build tsconfig.json  ${diagnostics.packageTsconfigLocation}`))

  if (errors.errors.size === 0) {
    console.log(chalk.green(' ✅ TS monorepo looks good!'))
  } else {
    console.log()
    errors.errors.forEach((messages, pkg) => {
      console.log(chalk` 📦 {red ${pkg.name}}   {grey ${pkg.pathRelativeToMonorepoRoot(diagnostics.repoRootDir)}\n}`)
      messages.forEach(message => console.log(chalk`    ${message}`))
      console.log()
    })
  }
}
