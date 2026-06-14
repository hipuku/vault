import { getDb } from '../index'
import type { Font, LocalFontFile } from '../../../shared/types'

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

/** A local family is one or more files mapped to weight/style. `source_url` holds
 *  the JSON file map; `weights` holds the distinct weight list. */
export function addLocalFont(family: string, files: LocalFontFile[]): Font {
  const db = getDb()
  const weights = JSON.stringify([...new Set(files.map(f => String(f.weight)))].sort((a, b) => Number(a) - Number(b)))
  const sourceUrl = JSON.stringify(files)
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO fonts (family, category, source, source_url, weights)
      VALUES (?, 'Local', 'local', ?, ?)
    `)
    .run(family, sourceUrl, weights)
  return db.prepare('SELECT * FROM fonts WHERE id = ?').get(Number(lastInsertRowid)) as Font
}

export function listFonts(): Font[] {
  return getDb().prepare('SELECT * FROM fonts ORDER BY family').all() as Font[]
}

export function updateFontFavourite(id: number, favourite: 0 | 1): void {
  getDb().prepare('UPDATE fonts SET favourite = ? WHERE id = ?').run(favourite, id)
}

export function typeScalesUsingFont(id: number): Array<{ id: number; name: string }> {
  return getDb().prepare(
    `SELECT DISTINCT id, name
       FROM type_scales
      WHERE heading_font_id = ? OR body_font_id = ?
      ORDER BY name`
  ).all(id, id) as Array<{ id: number; name: string }>
}

export function deleteFont(id: number): void {
  getDb().prepare('DELETE FROM fonts WHERE id = ?').run(id)
}
