import { getDb } from '../index'
import type { Colour } from '../../../shared/types'

export function createColour(hex: string, name: string): Colour {
  const db = getDb()
  const { lastInsertRowid } = db
    .prepare('INSERT INTO colours (hex, name) VALUES (?, ?)')
    .run(hex, name)
  return db.prepare('SELECT * FROM colours WHERE id = ?').get(Number(lastInsertRowid)) as Colour
}

export function listColours(): Colour[] {
  return getDb().prepare('SELECT * FROM colours ORDER BY created_at DESC').all() as Colour[]
}

export function updateColourName(id: number, name: string): void {
  getDb().prepare('UPDATE colours SET name = ? WHERE id = ?').run(name, id)
}

export function updateColourFavourite(id: number, favourite: 0 | 1): void {
  getDb().prepare('UPDATE colours SET favourite = ? WHERE id = ?').run(favourite, id)
}

/** Palettes that reference this colour (via an anchored swatch). A colour in use
 *  cannot be deleted. */
export function palettesUsingColour(id: number): Array<{ id: number; name: string }> {
  return getDb().prepare(
    `SELECT DISTINCT p.id, p.name
       FROM swatches s
       JOIN palettes p ON p.id = s.palette_id
      WHERE s.colour_id = ?
      ORDER BY p.name`
  ).all(id) as Array<{ id: number; name: string }>
}

/** asset_tags is polymorphic, so SQLite cannot cascade it — deleting the asset leaves
 *  its tag rows behind, and listTags counts them forever. Every delete clears its own. */
export function deleteColour(id: number): void {
  const db = getDb()
  db.transaction(() => {
    db.prepare(`DELETE FROM asset_tags WHERE asset_type = 'colour' AND asset_id = ?`).run(id)
    db.prepare('DELETE FROM colours WHERE id = ?').run(id)
  })()
}
