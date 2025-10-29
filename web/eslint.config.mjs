import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    rules: {
      // Prefer const when a variable isn’t reassigned
      'prefer-const': 'warn',

      // No errors for unused vars that start with _
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Allow any but warn so you can fix as needed
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
