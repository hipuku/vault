import { getDb } from '../index'
import type { Font } from '../../../shared/types'

export function addGoogleFont(family: string, category: string, weights: string): Font {
  const db = getDb()
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO fonts (family, category, source, source_url, weights)
      VALUES (?, ?, 'google', '', ?)
    `)
    .run(family, category, weights)
  return db.prepare('SELECT * FROM fonts WHERE id = ?').get(Number(lastInsertRowid)) as Font
}

export function addLocalFont(family: string, category: string, sourceUrl: string): Font {
  const db = getDb()
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO fonts (family, category, source, source_url, weights)
      VALUES (?, ?, 'local', ?, '["400"]')
    `)
    .run(family, category, sourceUrl)
  return db.prepare('SELECT * FROM fonts WHERE id = ?').get(Number(lastInsertRowid)) as Font
}

export function listFonts(): Font[] {
  return getDb().prepare('SELECT * FROM fonts ORDER BY family').all() as Font[]
}

export function updateFontFavourite(id: number, favourite: 0 | 1): void {
  getDb().prepare('UPDATE fonts SET favourite = ? WHERE id = ?').run(favourite, id)
}

export function deleteFont(id: number): void {
  getDb().prepare('DELETE FROM fonts WHERE id = ?').run(id)
}
