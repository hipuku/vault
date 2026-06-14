import { getDb } from '../index'
import type { TypeScale, TypeScaleStep, TypeScaleStepInput } from '../../../shared/types'

export function createTypeScale(
  name: string,
  headingFontId: number | null,
  bodyFontId: number | null,
  baseSize: number,
  ratio: string,
  steps: TypeScaleStepInput[]
): TypeScale {
  const db = getDb()
  const { lastInsertRowid } = db
    .prepare(`
      INSERT INTO type_scales (name, heading_font_id, body_font_id, base_size, ratio)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(name, headingFontId, bodyFontId, baseSize, ratio)
  const id = Number(lastInsertRowid)

  const insertStep = db.prepare(`
    INSERT INTO type_scale_steps
      (type_scale_id, step_name, size, weight, line_height, letter_spacing, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  db.transaction(() => {
    steps.forEach(s => {
      insertStep.run(id, s.step_name, s.size, s.weight, s.line_height, s.letter_spacing, s.sort_order)
    })
  })()

  return db.prepare('SELECT * FROM type_scales WHERE id = ?').get(id) as TypeScale
}

export function listTypeScales(): TypeScale[] {
  return getDb()
    .prepare('SELECT * FROM type_scales ORDER BY created_at DESC')
    .all() as TypeScale[]
}

export function updateTypeScaleName(id: number, name: string): void {
  getDb().prepare("UPDATE type_scales SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id)
}

export function deleteTypeScale(id: number): void {
  getDb().prepare('DELETE FROM type_scales WHERE id = ?').run(id)
}

export function listTypeScaleSteps(typeScaleId: number): TypeScaleStep[] {
  return getDb()
    .prepare('SELECT * FROM type_scale_steps WHERE type_scale_id = ? ORDER BY sort_order')
    .all(typeScaleId) as TypeScaleStep[]
}
