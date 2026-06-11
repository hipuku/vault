import { getDb } from '../index'
import type { Palette, Swatch } from '../../../shared/types'

export function createPaletteFromHex(name: string, baseHex: string, swatches: string[]): Palette {
  const db = getDb()
  const { lastInsertRowid } = db
    .prepare('INSERT INTO palettes (name, base_hex) VALUES (?, ?)')
    .run(name, baseHex)
  const id = Number(lastInsertRowid)

  const insertSwatch = db.prepare(
    'INSERT INTO swatches (palette_id, hex, label, sort_order) VALUES (?, ?, ?, ?)'
  )
  db.transaction((hexes: string[]) => {
    hexes.forEach((hex, i) => insertSwatch.run(id, hex, '', i))
  })(swatches)

  return db.prepare('SELECT * FROM palettes WHERE id = ?').get(id) as Palette
}

export function createPaletteFromLibrary(name: string, hexList: string[]): Palette {
  const db = getDb()
  const { lastInsertRowid } = db
    .prepare("INSERT INTO palettes (name, base_hex) VALUES (?, '')")
    .run(name)
  const id = Number(lastInsertRowid)

  const insertSwatch = db.prepare(
    'INSERT INTO swatches (palette_id, hex, label, sort_order) VALUES (?, ?, ?, ?)'
  )
  db.transaction((hexes: string[]) => {
    hexes.forEach((hex, i) => insertSwatch.run(id, hex, '', i))
  })(hexList)

  return db.prepare('SELECT * FROM palettes WHERE id = ?').get(id) as Palette
}

export function listPalettes(): Palette[] {
  return getDb()
    .prepare('SELECT * FROM palettes ORDER BY created_at DESC')
    .all() as Palette[]
}

export function updatePaletteFavourite(id: number, favourite: 0 | 1): void {
  getDb().prepare('UPDATE palettes SET favourite = ? WHERE id = ?').run(favourite, id)
}

export function duplicatePalette(id: number): Palette {
  const db = getDb()
  const source = db.prepare('SELECT * FROM palettes WHERE id = ?').get(id) as Palette
  const swatches = db
    .prepare('SELECT * FROM swatches WHERE palette_id = ? ORDER BY sort_order')
    .all(id) as Swatch[]

  const { lastInsertRowid } = db
    .prepare('INSERT INTO palettes (name, base_hex) VALUES (?, ?)')
    .run(`${source.name} copy`, source.base_hex)
  const newId = Number(lastInsertRowid)

  const insertSwatch = db.prepare(
    'INSERT INTO swatches (palette_id, hex, label, sort_order) VALUES (?, ?, ?, ?)'
  )
  db.transaction(() => {
    swatches.forEach(s => insertSwatch.run(newId, s.hex, s.label, s.sort_order))
  })()

  return db.prepare('SELECT * FROM palettes WHERE id = ?').get(newId) as Palette
}

export function deletePalette(id: number): void {
  getDb().prepare('DELETE FROM palettes WHERE id = ?').run(id)
}

export function listSwatches(paletteId: number): Swatch[] {
  return getDb()
    .prepare('SELECT * FROM swatches WHERE palette_id = ? ORDER BY sort_order')
    .all(paletteId) as Swatch[]
}

export function updateSwatchLabel(id: number, label: string): void {
  getDb().prepare('UPDATE swatches SET label = ? WHERE id = ?').run(label, id)
}

export function updateSwatchLocked(id: number, locked: 0 | 1): void {
  getDb().prepare('UPDATE swatches SET locked = ? WHERE id = ?').run(locked, id)
}

export function regeneratePalette(id: number, newHexes: string[]): Swatch[] {
  const db = getDb()
  const swatches = db
    .prepare('SELECT * FROM swatches WHERE palette_id = ? ORDER BY sort_order')
    .all(id) as Swatch[]

  const update = db.prepare('UPDATE swatches SET hex = ? WHERE id = ?')
  db.transaction(() => {
    swatches.forEach((s, i) => {
      if (!s.locked && newHexes[i] !== undefined) update.run(newHexes[i], s.id)
    })
  })()

  return db
    .prepare('SELECT * FROM swatches WHERE palette_id = ? ORDER BY sort_order')
    .all(id) as Swatch[]
}
