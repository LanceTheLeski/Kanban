import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  /*
    Layer direction.

    src/ is arranged in layers, and imports may only point downward:

        Pages / Layouts        routes and the app shell
              ↓
        Features               a domain area: Board, TagGroup
              ↓
        Entities               shared domain types: Card, Task, Timeline
              ↓
        Components / Lib       generic UI and infrastructure, no business logic

    Without something enforcing it that is just a story about the folders. These
    rules make the compiler tell you: an entity that reaches up into a feature is
    the first step to the layers meaning nothing.

    Not covered here: one feature importing another's internals. That needs the
    importing file's own path in the rule, which core ESLint cannot express —
    reach for eslint-plugin-boundaries when there is a third feature.
  */
  {
    files: ['src/Entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/Features/**', '**/Pages/**', '**/Layouts/**'],
          message: 'Entities sit below features. Move the shared piece down into Entities, or keep the feature-specific piece in the feature.',
        }],
      }],
    },
  },
  {
    files: ['src/Components/**/*.{ts,tsx}', 'src/Lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/Features/**', '**/Pages/**', '**/Layouts/**', '**/Entities/**'],
          message: 'Components and Lib are the bottom layer: generic, and unaware of this app\'s domain. Anything that needs a Card belongs in Entities or a Feature.',
        }],
      }],
    },
  },
])
