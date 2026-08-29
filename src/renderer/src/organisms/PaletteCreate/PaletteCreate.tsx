import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faBarsStaggered,
  faTableColumns,
  faCheck,
  faPlus,
  faMinus,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'
import type { Colour, Palette, Tag, TagWithCount, RampName, FillStrategy } from '@shared/types'
import { Toolbar } from '../../molecules/Toolbar/Toolbar'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { IconButton } from '../../atoms/IconButton/IconButton'
import { SegmentedControl } from '../../atoms/SegmentedControl/SegmentedControl'
import { TagSelect } from '../../molecules/TagSelect/TagSelect'
import { generateTonalSystem, TONAL_STOP_LABELS } from '@shared/lib/tonalSystem'
import { generateExpressiveSet, MAX_HUE_GROUPS } from '@shared/lib/expressiveSet'
import { prefersDarkText, nearestNames } from '../../lib/colour'
import { TAG_COLOURS } from '../../lib/tagColours'
import chroma from 'chroma-js'
import styles from './PaletteCreate.module.css'

interface PaletteCreateProps {
  library: Colour[]
  onCancel: () => void
  onCreateTonal: (name: string, seedHex: string, seedColourId: number | null, ramps: RampName[]) => Promise<Palette>
  onCreateExpressive: (
    name: string,
    seeds: Array<{ hex: string; colourId: number | null }>,
    targetCount: number,
    strategy: FillStrategy,
  ) => Promise<Palette>
}

const ALL_RAMPS: RampName[] = ['primary', 'neutral', 'success', 'warning', 'error']
const RAMP_LABELS: Record<RampName, string> = {
  primary: 'Primary',
  neutral: 'Neutral',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
}
const STRATEGIES: Array<{ id: FillStrategy; label: string }> = [
  { id: 'cohesive-distinct', label: 'Cohesive' },
  { id: 'interpolate', label: 'Interpolate' },
  { id: 'harmony', label: 'Harmony' },
]

export function PaletteCreate({
  library,
  onCancel,
  onCreateTonal,
  onCreateExpressive,
}: PaletteCreateProps): React.ReactElement {
  const [tab, setTab] = useState<'tonal' | 'expressive'>('tonal')
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')

  // Project scope
  const [projects, setProjects] = useState<TagWithCount[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [projectColourIds, setProjectColourIds] = useState<Set<number> | null>(null)

  const [tonalSeed, setTonalSeed] = useState<Colour | null>(null)
  const [ramps, setRamps] = useState<Set<RampName>>(new Set(['primary', 'neutral']))

  const [expSeeds, setExpSeeds] = useState<Colour[]>([])
  const [targetCount, setTargetCount] = useState(4)
  const [strategy, setStrategy] = useState<FillStrategy>('cohesive-distinct')

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load projects (tags) once.
  useEffect(() => {
    window.api.tag.list().then(setProjects)
  }, [])

  // Load the chosen project's colour membership.
  useEffect(() => {
    if (projectId == null) {
      setProjectColourIds(null)
      return
    }
    let live = true
    window.api.tag.listAssetIds('colour', projectId).then(ids => {
      if (live) setProjectColourIds(new Set(ids))
    })
    return () => {
      live = false
    }
  }, [projectId])

  function resetSeeds(): void {
    setTonalSeed(null)
    setExpSeeds([])
  }

  const selectProject = useCallback((t: Tag): void => {
    setProjectId(prev => (prev === t.id ? null : t.id))
    resetSeeds()
  }, [])

  const createProject = useCallback(async (label: string): Promise<void> => {
    const created = await window.api.tag.create(label, TAG_COLOURS[0])
    setProjects(prev => [...prev, created].sort((a, b) => a.label.localeCompare(b.label)))
    setProjectId(created.id)
    resetSeeds()
  }, [])

  // Colours scoped to the selected project.
  const scopedColours = useMemo(
    () => (projectColourIds ? library.filter(c => projectColourIds.has(c.id)) : []),
    [library, projectColourIds],
  )

  // ── Live preview ──────────────────────────────────────────────────────────
  const tonalGroups = useMemo(() => {
    if (!tonalSeed) return new Map<string, string[]>()
    const orderedRamps = ALL_RAMPS.filter(r => ramps.has(r))
    const out = generateTonalSystem(tonalSeed.hex, orderedRamps, tonalSeed.id)
    const map = new Map<string, string[]>()
    for (const s of out) {
      if (!map.has(s.group_key)) map.set(s.group_key, [])
      map.get(s.group_key)!.push(s.hex)
    }
    return map
  }, [tonalSeed, ramps])

  const expSwatches = useMemo(() => {
    if (expSeeds.length === 0) return []
    const seeds = expSeeds.map(c => ({ hex: c.hex, colourId: c.id }))
    const clamped = Math.max(seeds.length, Math.min(targetCount, MAX_HUE_GROUPS))
    return generateExpressiveSet(seeds, clamped, strategy)
  }, [expSeeds, targetCount, strategy])

  const expGroups = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of expSwatches) {
      if (!map.has(s.group_key)) map.set(s.group_key, [])
      map.get(s.group_key)!.push(s.hex)
    }
    return map
  }, [expSwatches])

  const nearIdentical = useMemo(() => {
    const mids = expSwatches.filter(s => s.label === '').map(s => s.hex)
    for (let i = 0; i < mids.length; i++)
      for (let j = i + 1; j < mids.length; j++) if (chroma.deltaE(mids[i], mids[j]) < 2.5) return true
    return false
  }, [expSwatches])

  // Name a hue group's mid: exact library match (seed colours) wins, else nearest.
  const hexToName = useMemo(() => new Map(library.map(c => [c.hex.toLowerCase(), c.name])), [library])
  const nameFor = (hex: string): string => hexToName.get(hex.toLowerCase()) ?? nearestNames(hex, 1).best.name

  // ── Seed grid ─────────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      q
        ? scopedColours.filter(
            c =>
              c.name.toLowerCase().startsWith(q) || c.hex.toLowerCase().replace('#', '').startsWith(q.replace('#', '')),
          )
        : scopedColours,
    [scopedColours, q],
  )
  const selectedIds = useMemo(
    () => new Set(tab === 'tonal' ? (tonalSeed ? [tonalSeed.id] : []) : expSeeds.map(s => s.id)),
    [tab, tonalSeed, expSeeds],
  )

  function pickSeed(c: Colour): void {
    if (tab === 'tonal') {
      setTonalSeed(prev => (prev?.id === c.id ? null : c))
    } else {
      setExpSeeds(prev => {
        if (prev.some(s => s.id === c.id)) return prev.filter(s => s.id !== c.id)
        if (prev.length >= MAX_HUE_GROUPS) return prev
        return [...prev, c]
      })
    }
  }

  function toggleRamp(r: RampName): void {
    if (r === 'primary' || r === 'neutral') return
    setRamps(prev => {
      const next = new Set(prev)
      if (next.has(r)) next.delete(r)
      else next.add(r)
      return next
    })
  }

  const minCount = Math.max(1, expSeeds.length)
  const hasSeeds = tab === 'tonal' ? tonalSeed !== null : expSeeds.length > 0
  const canCreate = name.trim().length > 0 && hasSeeds

  async function create(): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    setError(null)
    try {
      let palette: Palette
      if (tab === 'tonal' && tonalSeed) {
        palette = await onCreateTonal(
          trimmed,
          tonalSeed.hex,
          tonalSeed.id,
          ALL_RAMPS.filter(r => ramps.has(r)),
        )
      } else if (tab === 'expressive' && expSeeds.length > 0) {
        const seeds = expSeeds.map(c => ({ hex: c.hex, colourId: c.id }))
        const clamped = Math.max(seeds.length, Math.min(targetCount, MAX_HUE_GROUPS))
        palette = await onCreateExpressive(trimmed, seeds, clamped, strategy)
      } else {
        return
      }
      // Auto-join the palette to the project its seeds came from.
      if (projectId != null) await window.api.tag.assign('palette', palette.id, projectId)
      onCancel()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setCreating(false)
    }
  }

  const seedLabel = tab === 'tonal' ? 'Seed colour' : 'Seed colours'
  const seedHint = tab === 'tonal' ? ' (pick 1)' : ` (${expSeeds.length}/${MAX_HUE_GROUPS})`

  return (
    <>
      <Toolbar
        title={
          <span className={styles.titleRow}>
            <IconButton label="Back to palettes" onClick={onCancel}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </IconButton>
            New palette
          </span>
        }
        actions={
          <>
            {error && (
              <span className={styles.error} title={error}>
                {error}
              </span>
            )}
            <Button variant="ghost" size="md" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={create} disabled={!canCreate || creating}>
              {creating ? 'Creating…' : 'Create palette'}
            </Button>
          </>
        }
      />

      <div className={styles.panes}>
        {/* ── Controls ── */}
        <div className={styles.controls}>
          {/* 1 — Name */}
          <div className={styles.field}>
            <label className={styles.label}>
              Name <span className={styles.req}>*</span>
            </label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Palette name" autoFocus />
          </div>

          {/* 2 — Builder type */}
          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <SegmentedControl
              ariaLabel="Builder type"
              value={tab}
              onChange={setTab}
              options={[
                { id: 'tonal', label: 'Tonal System', icon: faBarsStaggered },
                { id: 'expressive', label: 'Expressive Set', icon: faTableColumns },
              ]}
            />
          </div>

          {/* 3 — Project */}
          <div className={styles.field}>
            <label className={styles.label}>Project</label>
            <TagSelect
              allTags={projects}
              selectedIds={projectId != null ? new Set([projectId]) : new Set()}
              onToggle={selectProject}
              onCreateNew={createProject}
              single
              placeholder="Choose a project…"
            />
          </div>

          {/* 4 — Seeds (scoped to project) */}
          <div className={styles.field}>
            <label className={styles.label}>
              {seedLabel}
              <span className={styles.labelHint}>{seedHint}</span>
            </label>

            {projectId == null ? (
              <p className={styles.empty}>Choose a project to pick seed colours from.</p>
            ) : scopedColours.length === 0 ? (
              <p className={styles.empty}>This project has no colours yet. Add colours to it from the Colors page.</p>
            ) : (
              <>
                <div className={styles.search}>
                  <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
                  <input
                    className={styles.searchInput}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search colours…"
                    spellCheck={false}
                  />
                </div>
                <div className={styles.seedGrid}>
                  {filtered.map(c => {
                    const on = selectedIds.has(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={[styles.seed, on ? styles.seedOn : ''].filter(Boolean).join(' ')}
                        style={{ background: c.hex }}
                        onClick={() => pickSeed(c)}
                        title={`${c.name} · ${c.hex}`}
                        aria-pressed={on}
                      >
                        {on && (
                          <FontAwesomeIcon icon={faCheck} style={{ color: prefersDarkText(c.hex) ? '#000' : '#fff' }} />
                        )}
                      </button>
                    )
                  })}
                  {filtered.length === 0 && <p className={styles.empty}>No colours match “{query.trim()}”.</p>}
                </div>
              </>
            )}
          </div>

          {/* 5 — Ramps / Strategy */}
          {tab === 'tonal' ? (
            <div className={styles.field}>
              <label className={styles.label}>Ramps</label>
              <div className={styles.ramps}>
                {ALL_RAMPS.map(r => {
                  const forced = r === 'primary' || r === 'neutral'
                  return (
                    <label key={r} className={[styles.ramp, forced ? styles.rampForced : ''].filter(Boolean).join(' ')}>
                      <input type="checkbox" checked={ramps.has(r)} disabled={forced} onChange={() => toggleRamp(r)} />
                      {RAMP_LABELS[r]}
                    </label>
                  )
                })}
              </div>
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Hue groups</label>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => setTargetCount(c => Math.max(minCount, c - 1))}
                    disabled={targetCount <= minCount}
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <span className={styles.stepVal}>{Math.max(minCount, Math.min(targetCount, MAX_HUE_GROUPS))}</span>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => setTargetCount(c => Math.min(MAX_HUE_GROUPS, c + 1))}
                    disabled={targetCount >= MAX_HUE_GROUPS}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Strategy</label>
                <div className={styles.strategy}>
                  {STRATEGIES.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={[styles.pill, strategy === s.id ? styles.pillOn : ''].filter(Boolean).join(' ')}
                      onClick={() => setStrategy(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Preview ── */}
        <div className={styles.previewPane}>
          {!hasSeeds ? (
            <div className={styles.previewEmpty}>
              {tab === 'tonal'
                ? 'Pick a seed colour to preview the ramps.'
                : 'Pick at least one seed colour to preview the set.'}
            </div>
          ) : tab === 'tonal' ? (
            <div className={styles.tonalPreview}>
              {Array.from(tonalGroups.entries()).map(([key, hexes]) => (
                <div key={key} className={styles.tonalRamp}>
                  <div className={styles.rampName}>{RAMP_LABELS[key as RampName] ?? key}</div>
                  <div className={styles.tonalStrip}>
                    {hexes.map((hex, i) => (
                      <div key={i} className={styles.tonalStop}>
                        <span className={styles.tonalSwatch} style={{ background: hex }} title={hex} />
                        <span className={styles.tonalStopLabel}>{TONAL_STOP_LABELS[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {nearIdentical && (
                <p className={styles.advisory}>Some colours are nearly identical — try a lower hue count.</p>
              )}
              <div className={styles.expPreview}>
                {Array.from(expGroups.values()).map((hexes, gi) => {
                  const mid = hexes[1] ?? hexes[0]
                  const base = nameFor(mid)
                  const stopLabels = ['Light', 'Default', 'Dark']
                  return (
                    <div key={gi} className={styles.expRow}>
                      <div className={styles.expRowName}>{base}</div>
                      <div className={styles.expRowStops}>
                        {hexes.map((hex, si) => (
                          <div key={si} className={styles.expStop}>
                            <span className={styles.expSwatch} style={{ background: hex }} title={hex} />
                            <span className={styles.expStopLabel}>{stopLabels[si]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
