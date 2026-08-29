import { getDb } from '../index'
import type { Tag, TagWithCount, AssetType } from '../../../shared/types'

export function createTag(label: string, colour: string): TagWithCount {
  const db = getDb()
  const { lastInsertRowid } = db.prepare('INSERT INTO tags (label, colour) VALUES (?, ?)').run(label, colour)
  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(Number(lastInsertRowid)) as Tag
  return { ...tag, count: 0 }
}

export function updateTag(id: number, label: string, colour: string): void {
  getDb().prepare('UPDATE tags SET label = ?, colour = ? WHERE id = ?').run(label, colour, id)
}

export function listTags(): TagWithCount[] {
  return getDb()
    .prepare(
      `
      SELECT t.*, COUNT(a.tag_id) AS count
      FROM tags t
      LEFT JOIN asset_tags a ON a.tag_id = t.id
      GROUP BY t.id
      ORDER BY t.label
    `,
    )
    .all() as TagWithCount[]
}

export function deleteTag(id: number): void {
  getDb().prepare('DELETE FROM tags WHERE id = ?').run(id)
}

export function assignTag(assetType: AssetType, assetId: number, tagId: number): void {
  getDb()
    .prepare('INSERT OR IGNORE INTO asset_tags (asset_type, asset_id, tag_id) VALUES (?, ?, ?)')
    .run(assetType, assetId, tagId)
}

export function removeTag(assetType: AssetType, assetId: number, tagId: number): void {
  getDb()
    .prepare('DELETE FROM asset_tags WHERE asset_type = ? AND asset_id = ? AND tag_id = ?')
    .run(assetType, assetId, tagId)
}

export function listTagsForAsset(assetType: AssetType, assetId: number): Tag[] {
  return getDb()
    .prepare(
      `
      SELECT t.* FROM tags t
      JOIN asset_tags a ON a.tag_id = t.id
      WHERE a.asset_type = ? AND a.asset_id = ?
      ORDER BY t.label
    `,
    )
    .all(assetType, assetId) as Tag[]
}

export function listAssetIdsForTag(assetType: AssetType, tagId: number): number[] {
  const rows = getDb()
    .prepare('SELECT asset_id FROM asset_tags WHERE asset_type = ? AND tag_id = ?')
    .all(assetType, tagId) as Array<{ asset_id: number }>
  return rows.map(r => r.asset_id)
}

export function listTagsForSection(assetType: AssetType): Tag[] {
  return getDb()
    .prepare(
      `
      SELECT DISTINCT t.* FROM tags t
      JOIN asset_tags a ON a.tag_id = t.id
      WHERE a.asset_type = ?
      ORDER BY t.label
    `,
    )
    .all(assetType) as Tag[]
}
