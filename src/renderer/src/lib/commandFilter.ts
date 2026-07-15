// Fuzzy matching + ranking for the command palette. Pure and framework-free so
// it can be unit-tested in isolation; the CommandPalette component layers icons
// and `run` callbacks on top of this.

export interface Searchable {
  id: string
  label: string
  /** Extra searchable terms not shown as the label (synonyms, section names). */
  keywords?: string
}

/**
 * Subsequence fuzzy score for `query` against `text`. Higher is better; returns
 * `null` when `query`'s characters don't appear in order within `text`.
 *
 * Rewards contiguous runs and matches at word boundaries, lightly penalises
 * skipped characters, and gives shorter targets a small edge so an exact short
 * label outranks the same match buried in a longer string.
 */
export function fuzzyScore(text: string, query: string): number | null {
  if (query === '') return 0
  const t = text.toLowerCase()
  const q = query.toLowerCase()

  let score = 0
  let from = 0
  let prev = -2
  for (const ch of q) {
    const at = t.indexOf(ch, from)
    if (at === -1) return null
    score += 1
    if (at === prev + 1) score += 3 // contiguous run
    if (at === 0 || /[\s\-_/]/.test(t[at - 1])) score += 2 // word boundary
    score -= Math.min(at - from, 4) * 0.1 // gap penalty (capped)
    prev = at
    from = at + 1
  }
  score += Math.max(0, 12 - t.length) * 0.05 // brevity edge
  return score
}

/**
 * Filter + rank commands for `query`. An empty/whitespace query returns the
 * commands unchanged (preserving caller-defined order). Otherwise, items whose
 * label or keywords fuzzy-match are returned best-first; ties keep input order.
 */
export function filterCommands<T extends Searchable>(commands: T[], query: string): T[] {
  const q = query.trim()
  if (q === '') return commands

  const scored: Array<{ item: T; score: number; index: number }> = []
  commands.forEach((item, index) => {
    const labelScore = fuzzyScore(item.label, q)
    const keywordScore = item.keywords ? fuzzyScore(`${item.label} ${item.keywords}`, q) : null
    let best: number | null = null
    if (labelScore !== null) best = labelScore
    if (keywordScore !== null && (best === null || keywordScore > best)) best = keywordScore
    if (best !== null) scored.push({ item, score: best, index })
  })

  scored.sort((a, b) => b.score - a.score || a.index - b.index)
  return scored.map(s => s.item)
}
