import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Two projects, because the suites have genuinely different needs. Aliases mirror
// electron.vite.config.ts. Tests live in test/, excluded from the app tsconfigs'
// include globs, so `npm run typecheck` stays scoped to shipping code.
const alias = {
  '@renderer': resolve('src/renderer/src'),
  '@shared': resolve('src/shared'),
}

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        // The pure logic in src/**/lib: no DOM, no setup file, nothing to tear
        // down between tests. Widening this to jsdom would make the whole domain
        // suite pay for a browser environment none of it uses.
        resolve: { alias },
        test: {
          name: 'domain',
          environment: 'node',
          include: ['test/**/*.test.ts'],
        },
      },
      {
        // Components. Added 2026-09-01: the two hooks carrying this app's keyboard
        // and focus behaviour had no test in this repo at all, and being
        // byte-comparable with core's copies stops being coverage the moment one
        // of them is changed to suit vault.
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'ui',
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          include: ['test/**/*.test.tsx'],
        },
      },
    ],
  },
})
