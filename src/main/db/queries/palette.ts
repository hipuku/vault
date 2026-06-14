import { getDb } from '../index'
import type { Colour, Palette, Swatch, SwatchInput, GenParams, RampName } from '../../../shared/types'

function insertPalette(
  name: string,
  kind: 'tonal' | 'expressive',
  baseHex: string,
  genParams: GenParams,
  swatches: SwatchInput[],
): Palette {
  const db = getDb()
  const { lastInsertRowid } = db
    .prepare('INSERT INTO palettes (name, kind, base_hex, gen_params) VALUES (?, ?, ?, ?)')
    .run(name, kind, baseHex, JSON.stringify(genParams))
  const id = Number(lastInsertRowid)
  const ins = db.prepare(
    `INSERT INTO swatches (palette_id, hex, label, group_key, colour_id, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  db.transaction((list: SwatchInput[]) => {
    for (const s of list) ins.run(id, s.hex, s.label, s.group_key, s.colour_id, s.sort_order)
  })(swatches)
  return db.prepare('SELECT * FROM palettes WHERE id = ?').get(id) as Palette
}

export function createTonalPalette(
  name: string,
  seedHex: string,
  seedColourId: number | null,
  ramps: RampName[],
  swatches: SwatchInput[],
): Palette {
  return insertPalette(name, 'tonal', seedHex,
    { kind: 'tonal', seedHex, seedColourId, ramps }, swatches)
}

export function createExpressivePalette(
  name: string,
  params: Extract<GenParams, { kind: 'expressive' }>,
  swatches: SwatchInput[],
): Palette {
  return insertPalette(name, 'expressive', '', params, swatches)
}

export function listPalettes(): Palette[] {
  return getDb()
    .prepare('SELECT * FROM palettes ORDER BY created_at DESC')
    .all() as Palette[]
}

export function updatePaletteName(id: number, name: string): void {
  getDb().prepare("UPDATE palettes SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id)
}

export function deletePalette(id: number): void {
  getDb().prepare('DELETE FROM palettes WHERE id = ?').run(id)
}

export function listSwatches(paletteId: number): Swatch[] {
  return getDb()
    .prepare('SELECT * FROM swatches WHERE palette_id = ? ORDER BY sort_order')
    .all(paletteId) as Swatch[]
}

export function promoteSwatch(swatchId: number, name: string): Colour {
  const db = getDb()
  const sw = db.prepare('SELECT * FROM swatches WHERE id = ?').get(swatchId) as Swatch
  const { lastInsertRowid } = db
    .prepare('INSERT INTO colours (hex, name) VALUES (?, ?)').run(sw.hex, name)
  const colourId = Number(lastInsertRowid)
  db.prepare('UPDATE swatches SET colour_id = ? WHERE id = ?').run(colourId, swatchId)
  return db.prepare('SELECT * FROM colours WHERE id = ?').get(colourId) as Colour
}
