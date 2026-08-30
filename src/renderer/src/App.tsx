import React, { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faPalette,
  faFont,
  faSwatchbook,
  faTextHeight,
  faPlus,
  faPen,
  faTrash,
  faFolderOpen,
  faCircle,
} from '@fortawesome/free-solid-svg-icons'
import type { Section, TagWithCount, Colour, Font } from '@shared/types'
import { useTags } from './hooks/useTags'
import { useConfirm } from './hooks/useConfirm'
import { Button } from './atoms/Button/Button'
import { Divider } from './atoms/Divider/Divider'
import { ConfirmDialog } from './molecules/ConfirmDialog/ConfirmDialog'
import { BrandWordmark } from './atoms/BrandWordmark/BrandWordmark'
import { TagModal } from './organisms/TagModal/TagModal'
import { ColorsPage } from './pages/ColorsPage'
import { FontsPage } from './pages/FontsPage'
import { PalettesPage } from './pages/PalettesPage'
import { TypeScalesPage } from './pages/TypeScalesPage'
import { TagView } from './pages/TagView'
import { CommandPalette, type Command } from './organisms/CommandPalette/CommandPalette'
import styles from './App.module.css'

// ── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: Array<{ section: Section; label: string; icon: IconDefinition }> = [
  { section: 'colours', label: 'Colors', icon: faPalette },
  { section: 'fonts', label: 'Fonts', icon: faFont },
  { section: 'palettes', label: 'Palettes', icon: faSwatchbook },
  { section: 'type_scales', label: 'Type Scales', icon: faTextHeight },
]

type TagModalState = { mode: 'create' } | { mode: 'edit'; tag: TagWithCount }

function Sidebar({
  activeSection,
  onSectionChange,
  activeTagId,
  onTagSelect,
  tags,
  createTag,
  updateTag,
  deleteTag,
}: {
  activeSection: Section | null
  onSectionChange: (s: Section) => void
  activeTagId: number | null
  onTagSelect: (id: number | null) => void
  tags: TagWithCount[]
  createTag: (label: string, colour: string) => Promise<TagWithCount>
  updateTag: (id: number, label: string, colour: string) => Promise<void>
  deleteTag: (id: number) => Promise<void>
}): React.ReactElement {
  const [modal, setModal] = useState<TagModalState | null>(null)
  const confirm = useConfirm()

  async function handleSubmit(label: string, colour: string): Promise<void> {
    if (modal?.mode === 'edit') await updateTag(modal.tag.id, label, colour)
    else await createTag(label, colour)
    setModal(null)
  }

  async function handleDelete(tag: TagWithCount): Promise<void> {
    const used = tag.count > 0
    const ok = await confirm.confirm({
      title: `Delete "${tag.label}"?`,
      message: used
        ? `It's on ${tag.count} ${tag.count === 1 ? 'item' : 'items'} and will be removed from ${tag.count === 1 ? 'it' : 'them'}. This can't be undone.`
        : `This project isn't used yet. This can't be undone.`,
      confirmLabel: 'Delete project',
    })
    if (ok) {
      if (activeTagId === tag.id) onTagSelect(null)
      await deleteTag(tag.id)
    }
  }

  return (
    <nav className="sidebar">
      <div className="titlebar-inset" />

      <div className={styles.brand}>
        <BrandWordmark className={styles.brandWordmark} />
      </div>

      {NAV_ITEMS.map(({ section, label, icon }) => (
        <button
          key={section}
          type="button"
          className={[styles.navItem, activeSection === section ? styles.navItemActive : ''].filter(Boolean).join(' ')}
          onClick={() => onSectionChange(section)}
        >
          <FontAwesomeIcon icon={icon} className={styles.navIcon} />
          {label}
        </button>
      ))}

      {tags.length > 0 && (
        <>
          <Divider className={styles.tagDivider} />
          <div className={styles.navSection}>Projects</div>
          <div className={styles.tagsArea}>
            {tags.map(tag => (
              <div
                key={tag.id}
                className={[styles.tagItem, activeTagId === tag.id ? styles.tagItemActive : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  className={styles.tagSelect}
                  onClick={() => onTagSelect(activeTagId === tag.id ? null : tag.id)}
                >
                  <span className={styles.tagDot} style={{ background: tag.colour }} />
                  <span className={styles.tagLabel}>{tag.label}</span>
                </button>
                <div className={styles.tagItemActions}>
                  <button
                    type="button"
                    className="icon-btn icon-btn--xs"
                    aria-label={`Edit project ${tag.label}`}
                    onClick={() => setModal({ mode: 'edit', tag })}
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--xs icon-btn--danger"
                    aria-label={`Delete project ${tag.label}`}
                    onClick={() => handleDelete(tag)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.sidebarFooter}>
        <Button variant="secondary" size="md" className={styles.addTagBtn} onClick={() => setModal({ mode: 'create' })}>
          <FontAwesomeIcon icon={faPlus} />
          Add project
        </Button>
      </div>

      <TagModal
        open={modal !== null}
        mode={modal?.mode ?? 'create'}
        initial={modal?.mode === 'edit' ? { label: modal.tag.label, colour: modal.tag.colour } : undefined}
        onSubmit={handleSubmit}
        onClose={() => setModal(null)}
      />

      <ConfirmDialog
        open={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        onConfirm={confirm.onConfirm}
        onCancel={confirm.onCancel}
      />
    </nav>
  )
}

// ── Page switch ───────────────────────────────────────────────────────────────

function ActivePage({
  section,
  activeTagId,
  openCreate,
  onCreateConsumed,
  openItemId,
  onItemOpened,
}: {
  section: Section
  activeTagId: number | null
  openCreate: boolean
  onCreateConsumed: () => void
  openItemId: number | null
  onItemOpened: () => void
}): React.ReactElement {
  const create = { openCreate, onCreateConsumed }
  const openItem = { openItemId, onItemOpened }
  switch (section) {
    case 'colours':
      return <ColorsPage activeTagId={activeTagId} {...create} {...openItem} />
    case 'fonts':
      return <FontsPage activeTagId={activeTagId} {...create} {...openItem} />
    case 'palettes':
      return <PalettesPage activeTagId={activeTagId} {...create} />
    case 'type_scales':
      return <TypeScalesPage activeTagId={activeTagId} {...create} />
  }
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App(): React.ReactElement {
  const [activeSection, setActiveSection] = useState<Section>('colours')
  const [activeTagId, setActiveTagId] = useState<number | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [pendingCreate, setPendingCreate] = useState<Section | null>(null)
  const [pendingOpen, setPendingOpen] = useState<{ section: Section; id: number } | null>(null)
  const [libColours, setLibColours] = useState<Colour[]>([])
  const [libFonts, setLibFonts] = useState<Font[]>([])
  const { tags, createTag, updateTag, deleteTag } = useTags()

  function handleSectionChange(section: Section): void {
    setActiveSection(section)
    setActiveTagId(null)
  }

  // ⌘K (or Ctrl-K) toggles the command palette from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Refresh the searchable library (colours + fonts) each time the palette opens,
  // so renames/additions/deletions are always reflected.
  useEffect(() => {
    if (!paletteOpen) return
    window.api.colour.list().then(setLibColours)
    window.api.font.list().then(setLibFonts)
  }, [paletteOpen])

  const commands: Command[] = useMemo(() => {
    const goTo = (section: Section): void => {
      setActiveSection(section)
      setActiveTagId(null)
    }
    const create = (section: Section): void => {
      setActiveSection(section)
      setActiveTagId(null)
      setPendingCreate(section)
    }
    const openItem = (section: Section, id: number): void => {
      setActiveSection(section)
      setActiveTagId(null)
      setPendingOpen({ section, id })
    }

    const nav: Command[] = NAV_ITEMS.map(n => ({
      id: `nav-${n.section}`,
      label: `Go to ${n.label}`,
      hint: 'Navigate',
      keywords: n.label,
      icon: n.icon,
      run: () => goTo(n.section),
    }))
    const creates: Command[] = [
      {
        id: 'create-colour',
        label: 'Add colour',
        hint: 'Create',
        icon: faPlus,
        keywords: 'new colour color hex',
        run: () => create('colours'),
      },
      {
        id: 'create-font',
        label: 'Add font',
        hint: 'Create',
        icon: faPlus,
        keywords: 'new font typeface',
        run: () => create('fonts'),
      },
      {
        id: 'create-palette',
        label: 'New palette',
        hint: 'Create',
        icon: faPlus,
        keywords: 'create palette tonal expressive',
        run: () => create('palettes'),
      },
      {
        id: 'create-type-scale',
        label: 'New type scale',
        hint: 'Create',
        icon: faPlus,
        keywords: 'create type scale typography',
        run: () => create('type_scales'),
      },
    ]
    const projects: Command[] = tags.map(t => ({
      id: `project-${t.id}`,
      label: `Open ${t.label}`,
      hint: 'Project',
      keywords: `project ${t.label}`,
      icon: faFolderOpen,
      run: () => setActiveTagId(t.id),
    }))
    // Library items, surfaced only while searching (searchOnly), so the default
    // view stays a short list of actions rather than the whole library.
    const colours: Command[] = libColours.map(c => ({
      id: `colour-${c.id}`,
      label: c.name,
      hint: 'Colour',
      keywords: `colour color ${c.hex}`,
      icon: faCircle,
      iconColor: c.hex,
      searchOnly: true,
      run: () => openItem('colours', c.id),
    }))
    const fonts: Command[] = libFonts.map(f => ({
      id: `font-${f.id}`,
      label: f.family,
      hint: 'Font',
      keywords: `font typeface ${f.family}`,
      icon: faFont,
      searchOnly: true,
      run: () => openItem('fonts', f.id),
    }))
    return [...nav, ...creates, ...projects, ...colours, ...fonts]
  }, [tags, libColours, libFonts])

  const inTagView = activeTagId !== null

  return (
    <div className="app">
      <Sidebar
        activeSection={inTagView ? null : activeSection}
        onSectionChange={handleSectionChange}
        activeTagId={activeTagId}
        onTagSelect={setActiveTagId}
        tags={tags}
        createTag={createTag}
        updateTag={updateTag}
        deleteTag={deleteTag}
      />
      <main className="main">
        <div className="titlebar-inset" />
        {inTagView ? (
          <TagView tagId={activeTagId!} />
        ) : (
          <ActivePage
            section={activeSection}
            activeTagId={null}
            openCreate={pendingCreate === activeSection}
            onCreateConsumed={() => setPendingCreate(null)}
            openItemId={pendingOpen?.section === activeSection ? pendingOpen.id : null}
            onItemOpened={() => setPendingOpen(null)}
          />
        )}
      </main>
      <CommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
