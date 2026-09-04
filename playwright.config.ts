import { defineConfig } from '@playwright/test'

/**
 * End to end, against the real Electron app.
 *
 * The 14 test files here are twelve pure functions and two components. Nothing
 * touches the IPC boundary, which is the thing the case study leads with: a
 * typed surface between a renderer that can reach nothing and a main process
 * that owns the database and the disk. Every claim about that boundary was
 * asserted by reading the code.
 *
 * This launches the built app, so main, preload, renderer and SQLite are all
 * the real ones. `--user-data-dir` points the whole thing at a throwaway
 * directory: `app.getPath('userData')` is where `vault.db` lives, so without it
 * a test run would write into the library on this machine.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { trace: 'on-first-retry' },
})
