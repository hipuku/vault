import { app, BrowserWindow, ipcMain, clipboard, shell, dialog, nativeImage } from 'electron'
import { join, resolve, relative, isAbsolute } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { is } from '@electron-toolkit/utils'
import * as colourQueries from './db/queries/colour'
import * as fontQueries from './db/queries/font'
import { getGoogleFonts } from './lib/googleFonts'
import { copyFontFiles } from './lib/fontStorage'
import { listInstalledFonts } from './lib/installedFonts'
import * as paletteQueries from './db/queries/palette'
import * as typeScaleQueries from './db/queries/type-scale'
import * as tagQueries from './db/queries/tag'
import { generateTonalSystem } from '../shared/lib/tonalSystem'
import { generateExpressiveSet } from '../shared/lib/expressiveSet'
import type { AssetType, TypeScaleStepInput, FillStrategy, RampName, LocalFontFile } from '../shared/types'

/** The scheme of a URL, or '' if it will not parse. */
function safeProtocol(url: string): string {
  try {
    return new URL(url).protocol
  } catch {
    return ''
  }
}

/** Resolve a renderer-supplied font path, refusing anything outside the directory the
 *  app owns. Both callers pass a path that came from the database, and every path the
 *  database holds was written by copyFontFiles into userData/fonts — so this rejects
 *  nothing legitimate, and stops the two path-taking handlers being a general-purpose
 *  read-any-file / reveal-any-file primitive for the renderer. */
function ownedFontPath(candidate: string): string {
  const root = resolve(app.getPath('userData'), 'fonts')
  const full = resolve(root, candidate)
  const rel = relative(root, full)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('Refusing to read outside the managed fonts directory.')
  }
  return full
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#fefefe',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.on('ready-to-show', () => win.show())

  // Only http(s) reaches the OS opener. Any other scheme — file:, smb:, a custom
  // handler registered by another app — is a way to have the shell run something on
  // the user's behalf from a string the renderer chose.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:$/.test(safeProtocol(url))) shell.openExternal(url)
    return { action: 'deny' }
  })

  // The renderer is only ever the bundled app. Without this, anything that can set
  // location.href moves the top-level frame to a remote origin, and that origin then
  // holds the whole window.api surface.
  win.webContents.on('will-navigate', (event, url) => {
    const devServer = process.env['ELECTRON_RENDERER_URL']
    const allowed = devServer ? url.startsWith(devServer) : url.startsWith('file://')
    if (!allowed) event.preventDefault()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── Colours ───────────────────────────────────────────────────────────────────

ipcMain.handle('colour:create', (_e, hex: string, name: string) =>
  colourQueries.createColour(hex, name)
)
ipcMain.handle('colour:list', () => colourQueries.listColours())
ipcMain.handle('colour:update-name', (_e, id: number, name: string) =>
  colourQueries.updateColourName(id, name)
)
ipcMain.handle('colour:update-favourite', (_e, id: number, favourite: 0 | 1) =>
  colourQueries.updateColourFavourite(id, favourite)
)
ipcMain.handle('colour:palettes-using', (_e, id: number) => colourQueries.palettesUsingColour(id))
ipcMain.handle('colour:delete', (_e, id: number) => {
  // A colour used to build a palette cannot be deleted (it anchors swatches).
  const using = colourQueries.palettesUsingColour(id)
  if (using.length > 0) {
    throw new Error(`In use by ${using.length} palette${using.length === 1 ? '' : 's'}`)
  }
  return colourQueries.deleteColour(id)
})

// ── Fonts ─────────────────────────────────────────────────────────────────────

ipcMain.handle('font:add-google', (_e, family: string, category: string, weights: string) =>
  fontQueries.addGoogleFont(family, category, weights)
)
ipcMain.handle('font:add-local', async (_e, family: string, files: LocalFontFile[]) => {
  // Copy the bytes into app storage so the vault owns them (no broken paths).
  const copied = await copyFontFiles(files)
  return fontQueries.addLocalFont(family, copied)
})
ipcMain.handle('font:list-installed', () => listInstalledFonts())
ipcMain.handle('font:reveal', (_e, path: string) => shell.showItemInFolder(ownedFontPath(path)))
ipcMain.handle('font:download-google', async (_e, family: string, weights: string[]) => {
  const fam = family.trim().replace(/\s+/g, '+')
  const wght = [...new Set(weights)].sort((a, b) => Number(a) - Number(b)).join(';')
  const cssUrl = `https://fonts.googleapis.com/css2?family=${fam}:wght@${wght}&display=swap`
  // A desktop UA makes Google serve woff2 (and emit the file URL we want).
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  const css = await (await fetch(cssUrl, { headers: { 'User-Agent': ua } })).text()
  const match = css.match(/url\((https:[^)]+\.woff2)\)/)
  if (!match) throw new Error('No downloadable file found for this font.')
  const bytes = Buffer.from(await (await fetch(match[1])).arrayBuffer())
  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: `${fam.replace(/\+/g, '')}.woff2` })
  if (canceled || !filePath) return false
  await writeFile(filePath, bytes)
  return true
})
ipcMain.handle('font:list', () => fontQueries.listFonts())
ipcMain.handle('font:update-favourite', (_e, id: number, favourite: 0 | 1) =>
  fontQueries.updateFontFavourite(id, favourite)
)
ipcMain.handle('font:scales-using', (_e, id: number) => fontQueries.typeScalesUsingFont(id))
ipcMain.handle('font:delete', (_e, id: number) => {
  // A font used by a type scale cannot be deleted (it anchors heading/body roles).
  const using = fontQueries.typeScalesUsingFont(id)
  if (using.length > 0) {
    throw new Error(`In use by ${using.length} type scale${using.length === 1 ? '' : 's'}`)
  }
  return fontQueries.deleteFont(id)
})
ipcMain.handle('font:google-list', () => getGoogleFonts())
ipcMain.handle('font:read-file', async (_e, path: string) => {
  const buf = await readFile(ownedFontPath(path))
  return new Uint8Array(buf)
})

// ── Palettes ──────────────────────────────────────────────────────────────────

ipcMain.handle('palette:create-tonal', (_e, name: string, seedHex: string, seedColourId: number | null, ramps: RampName[]) => {
  const swatches = generateTonalSystem(seedHex, ramps, seedColourId)
  return paletteQueries.createTonalPalette(name, seedHex, seedColourId, ramps, swatches)
})
ipcMain.handle('palette:create-expressive', (_e, name: string, seeds: Array<{ hex: string; colourId: number | null }>, targetCount: number, strategy: FillStrategy) => {
  const swatches = generateExpressiveSet(seeds, targetCount, strategy)
  return paletteQueries.createExpressivePalette(name, { kind: 'expressive', seeds, targetCount, strategy }, swatches)
})
ipcMain.handle('palette:list', () => paletteQueries.listPalettes())
ipcMain.handle('palette:update-name', (_e, id: number, name: string) =>
  paletteQueries.updatePaletteName(id, name)
)
ipcMain.handle('palette:delete', (_e, id: number) => paletteQueries.deletePalette(id))

// ── Swatches ──────────────────────────────────────────────────────────────────

ipcMain.handle('swatch:list', (_e, paletteId: number) =>
  paletteQueries.listSwatches(paletteId)
)
ipcMain.handle('swatch:promote', (_e, id: number, name: string) =>
  paletteQueries.promoteSwatch(id, name)
)

// ── Type Scales ───────────────────────────────────────────────────────────────

ipcMain.handle(
  'type-scale:create',
  (_e, name: string, headingFontId: number | null, bodyFontId: number | null, baseSize: number, ratio: string, steps: TypeScaleStepInput[]) =>
    typeScaleQueries.createTypeScale(name, headingFontId, bodyFontId, baseSize, ratio, steps)
)
ipcMain.handle('type-scale:list', () => typeScaleQueries.listTypeScales())
ipcMain.handle('type-scale:update-name', (_e, id: number, name: string) =>
  typeScaleQueries.updateTypeScaleName(id, name)
)
ipcMain.handle('type-scale:delete', (_e, id: number) => typeScaleQueries.deleteTypeScale(id))
ipcMain.handle('type-scale-step:list', (_e, typeScaleId: number) =>
  typeScaleQueries.listTypeScaleSteps(typeScaleId)
)

// ── Tags ──────────────────────────────────────────────────────────────────────

ipcMain.handle('tag:create', (_e, label: string, colour: string) =>
  tagQueries.createTag(label, colour)
)
ipcMain.handle('tag:update', (_e, id: number, label: string, colour: string) =>
  tagQueries.updateTag(id, label, colour)
)
ipcMain.handle('tag:list', () => tagQueries.listTags())
ipcMain.handle('tag:delete', (_e, id: number) => tagQueries.deleteTag(id))
ipcMain.handle('tag:assign', (_e, assetType: AssetType, assetId: number, tagId: number) =>
  tagQueries.assignTag(assetType, assetId, tagId)
)
ipcMain.handle('tag:remove', (_e, assetType: AssetType, assetId: number, tagId: number) =>
  tagQueries.removeTag(assetType, assetId, tagId)
)
ipcMain.handle('tag:list-for-asset', (_e, assetType: AssetType, assetId: number) =>
  tagQueries.listTagsForAsset(assetType, assetId)
)
ipcMain.handle('tag:list-for-section', (_e, assetType: AssetType) =>
  tagQueries.listTagsForSection(assetType)
)
ipcMain.handle('tag:list-asset-ids', (_e, assetType: AssetType, tagId: number) =>
  tagQueries.listAssetIdsForTag(assetType, tagId)
)

// ── Clipboard ─────────────────────────────────────────────────────────────────

ipcMain.handle('clipboard:write', (_e, text: string) => {
  clipboard.writeText(text)
})

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Dev dock icon (packaged builds get it from electron-builder's build.mac.icon).
  if (process.platform === 'darwin' && app.dock) {
    const icon = nativeImage.createFromPath(join(app.getAppPath(), 'resources', 'icon.png'))
    if (!icon.isEmpty()) app.dock.setIcon(icon)
  }
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
