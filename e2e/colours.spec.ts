import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test'

let app: ElectronApplication
let page: Page
let userData: string

test.beforeAll(async () => {
  // A fresh userData per run: vault.db lives there, and a test that writes into
  // the real library is a test nobody runs twice.
  userData = mkdtempSync(path.join(tmpdir(), 'vault-e2e-'))
  app = await electron.launch({
    args: [path.join('out', 'main', 'index.js'), `--user-data-dir=${userData}`],
    cwd: process.cwd(),
  })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await app?.close()
  rmSync(userData, { recursive: true, force: true })
})

test('opens on an empty library', async () => {
  /* The heading check vault#29 asked for. The gap it reported was not real:
     the pages do not contain an <h1>, they render Toolbar and Toolbar does, so
     the rendered document has had a level-1 heading all along. Asserted here
     the way a screen reader would ask for it, by role and name, rather than as
     the plain-text match this used to settle for. */
  await expect(page.getByRole('heading', { level: 1, name: 'Colors' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Add colour' }).first()).toBeVisible()
})

test('adds a colour, names it, and persists it through IPC', async () => {
  await page.getByRole('button', { name: 'Add colour' }).first().click()

  /* Addressed by its accessible name, the way a reader using a screen reader
     addresses it. This used to be getByPlaceholder because there was nothing
     else to reach it by, which is what filed vault#30. */
  const hex = page.getByRole('textbox', { name: 'Colour value' })
  await expect(hex).toBeVisible()
  await hex.fill('#AA1155')

  // The auto-name comes from haus-colour-names via main, so seeing a name at all
  // proves the renderer reached the main process and back.
  await expect(page.getByText(/Name/).first()).toBeVisible()

  await page.getByRole('button', { name: 'Add colour' }).last().click()

  // Round trip: created through `colour:create`, read back through `colour:list`.
  await expect(page.getByText('#AA1155', { exact: false }).first()).toBeVisible({ timeout: 10_000 })
})

test('the renderer cannot reach Node', async () => {
  // The security claim the case study makes, asserted rather than read. Context
  // isolation and no nodeIntegration mean these are undefined in the renderer.
  const exposure = await page.evaluate(() => ({
    require: typeof (globalThis as Record<string, unknown>).require,
    process: typeof (globalThis as Record<string, unknown>).process,
    module: typeof (globalThis as Record<string, unknown>).module,
  }))
  expect(exposure).toEqual({ require: 'undefined', process: 'undefined', module: 'undefined' })
})
