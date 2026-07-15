import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

// Unit tests for the pure logic in src/**/lib. Kept out of the app tsconfigs
// (tests live in test/, excluded from include globs) so `npm run typecheck`
// stays scoped to shipping code. Aliases mirror electron.vite.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@shared': resolve('src/shared'),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
