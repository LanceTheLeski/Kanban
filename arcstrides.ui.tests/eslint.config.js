import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import arc from '../arcstrides.ui/tools/eslint-arc.js'
import { layoutRules } from '../arcstrides.ui/tools/eslint-arc-layout.js'

/*
  The UI's conventions hold here too: its rules, imported rather than copied,
  so a test reads like the code it tests. The rules about components and file
  names have nothing to check in a folder of test files, and are left out.
  docs/ui-conventions.md, "Tests".
*/
export default defineConfig([
  globalIgnores(['node_modules']),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    plugins: { arc },
    rules: {
      'arc/private-last': 'error',
      'arc/no-space-before-paren': 'error',
      'arc/colours-from-palette': 'error',
      ...Object.fromEntries(Object.keys(layoutRules).map(rule => [`arc/${rule}`, 'error'])),
    },
  },
])
