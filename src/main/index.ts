import { app, BrowserWindow, ipcMain, clipboard, shell } from 'electron'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { is } from '@electron-toolkit/utils'
import * as colourQueries from './db/queries/colour'
import * as fontQueries from './db/queries/font'
import { getGoogleFonts } from './lib/googleFonts'
import * as paletteQueries from './db/queries/palette'
import * as typeScaleQueries from './db/queries/type-scale'
import * as tagQueries from './db/queries/tag'
import { generateLightnessScale } from '../shared/lib/lightnessScale'
import type { AssetType, TypeScaleStepInput } from '../shared/types'

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

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
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
ipcMain.handle('colour:delete', (_e, id: number) => colourQueries.deleteColour(id))

// ── Fonts ─────────────────────────────────────────────────────────────────────

ipcMain.handle('font:add-google', (_e, family: string, category: string, weights: string) =>
  fontQueries.addGoogleFont(family, category, weights)
)
ipcMain.handle('font:add-local', (_e, family: string, category: string, sourceUrl: string) =>
  fontQueries.addLocalFont(family, category, sourceUrl)
)
ipcMain.handle('font:list', () => fontQueries.listFonts())
ipcMain.handle('font:update-favourite', (_e, id: number, favourite: 0 | 1) =>
  fontQueries.updateFontFavourite(id, favourite)
)
ipcMain.handle('font:delete', (_e, id: number) => fontQueries.deleteFont(id))
ipcMain.handle('font:google-list', () => getGoogleFonts())
ipcMain.handle('font:read-file', async (_e, path: string) => {
  const buf = await readFile(path)
  return new Uint8Array(buf)
})

// ── Palettes ──────────────────────────────────────────────────────────────────

ipcMain.handle('palette:create-from-hex', (_e, name: string, baseHex: string, swatches: string[]) =>
  paletteQueries.createPaletteFromHex(name, baseHex, swatches)
)
ipcMain.handle('palette:create-from-library', (_e, name: string, hexList: string[]) =>
  paletteQueries.createPaletteFromLibrary(name, hexList)
)
ipcMain.handle('palette:list', () => paletteQueries.listPalettes())
ipcMain.handle('palette:update-favourite', (_e, id: number, favourite: 0 | 1) =>
  paletteQueries.updatePaletteFavourite(id, favourite)
)
ipcMain.handle('palette:duplicate', (_e, id: number) => paletteQueries.duplicatePalette(id))
ipcMain.handle('palette:delete', (_e, id: number) => paletteQueries.deletePalette(id))
ipcMain.handle('palette:regenerate', (_e, id: number) => {
  const swatches = paletteQueries.listSwatches(id)
  const lockedHexes = swatches.map(s => (s.locked ? s.hex : null))
  const palette = paletteQueries.listPalettes().find(p => p.id === id)
  const baseHex = palette?.base_hex || swatches[4]?.hex || '#6b7280'
  const newScale = generateLightnessScale(baseHex, { steps: swatches.length })
  const merged = newScale.map((hex, i) => lockedHexes[i] ?? hex)
  return paletteQueries.regeneratePalette(id, merged)
})

// ── Swatches ──────────────────────────────────────────────────────────────────

ipcMain.handle('swatch:list', (_e, paletteId: number) =>
  paletteQueries.listSwatches(paletteId)
)
ipcMain.handle('swatch:update-label', (_e, id: number, label: string) =>
  paletteQueries.updateSwatchLabel(id, label)
)
ipcMain.handle('swatch:update-locked', (_e, id: number, locked: 0 | 1) =>
  paletteQueries.updateSwatchLocked(id, locked)
)

// ── Type Scales ───────────────────────────────────────────────────────────────

ipcMain.handle(
  'type-scale:create',
  (_e, name: string, headingFontId: number | null, bodyFontId: number | null, baseSize: number, ratio: string, steps: TypeScaleStepInput[]) =>
    typeScaleQueries.createTypeScale(name, headingFontId, bodyFontId, baseSize, ratio, steps)
)
ipcMain.handle('type-scale:list', () => typeScaleQueries.listTypeScales())
ipcMain.handle('type-scale:update-favourite', (_e, id: number, favourite: 0 | 1) =>
  typeScaleQueries.updateTypeScaleFavourite(id, favourite)
)
ipcMain.handle('type-scale:delete', (_e, id: number) => typeScaleQueries.deleteTypeScale(id))
ipcMain.handle('type-scale-step:list', (_e, typeScaleId: number) =>
  typeScaleQueries.listTypeScaleSteps(typeScaleId)
)
ipcMain.handle(
  'type-scale-step:update',
  (_e, id: number, size: number, weight: number, lineHeight: string, letterSpacing: string) =>
    typeScaleQueries.updateTypeScaleStep(id, size, weight, lineHeight, letterSpacing)
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
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
