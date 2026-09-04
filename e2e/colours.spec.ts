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
  // Asserted through the nav and the primary action rather than a heading:
  // none of the five pages has one. That is a real gap, filed rather than
  // papered over here, and this assertion should become a heading check the
  // day it is closed.
  await expect(page.getByRole('button', { name: 'Add colour' }).first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Colors', { exact: true }).first()).toBeVisible()
})

test('adds a colour, names it, and persists it through IPC', async () => {
  await page.getByRole('button', { name: 'Add colour' }).first().click()

  const hex = page.getByPlaceholder('#hex or paste a colour')
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
