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

export function deleteColour(id: number): void {
  getDb().prepare('DELETE FROM colours WHERE id = ?').run(id)
}
