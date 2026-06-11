import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faPalette, faFont, faSwatchbook, faTextHeight, faPlus, faPen, faTrash,
} from '@fortawesome/free-solid-svg-icons'
import type { Section, TagWithCount } from '@shared/types'
import { useTags } from './hooks/useTags'
import { useConfirm } from './hooks/useConfirm'
import { Button } from './atoms/Button/Button'
import { Divider } from './atoms/Divider/Divider'
import { ConfirmDialog } from './primitives/ConfirmDialog/ConfirmDialog'
import { BrandWordmark } from './domain/BrandWordmark/BrandWordmark'
import { TagModal } from './domain/TagModal/TagModal'
import { ColorsPage } from './pages/ColorsPage'
import { FontsPage } from './pages/FontsPage'
import { PalettesPage } from './pages/PalettesPage'
import { TypeScalesPage } from './pages/TypeScalesPage'
import { TagView } from './pages/TagView'
import styles from './App.module.css'

// ── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: Array<{ section: Section; label: string; icon: IconDefinition }> = [
  { section: 'colours',     label: 'Colors',     icon: faPalette    },
  { section: 'fonts',       label: 'Fonts',      icon: faFont       },
  { section: 'palettes',    label: 'Palettes',   icon: faSwatchbook },
  { section: 'type_scales', label: 'Type Scales', icon: faTextHeight },
]

type TagModalState = { mode: 'create' } | { mode: 'edit'; tag: TagWithCount }

function Sidebar({
  activeSection,
  onSectionChange,
  activeTagId,
  onTagSelect,
}: {
  activeSection: Section | null
  onSectionChange: (s: Section) => void
  activeTagId: number | null
  onTagSelect: (id: number | null) => void
}): React.ReactElement {
  const { tags, createTag, updateTag, deleteTag } = useTags()
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
        : `This tag isn't used yet. This can't be undone.`,
      confirmLabel: 'Delete tag',
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
          <div className={styles.navSection}>Tags</div>
          <div className={styles.tagsArea}>
            {tags.map(tag => (
              <div
                key={tag.id}
                className={[styles.tagItem, activeTagId === tag.id ? styles.tagItemActive : ''].filter(Boolean).join(' ')}
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
                  <button type="button" className={styles.tagAction} aria-label={`Edit tag ${tag.label}`} onClick={() => setModal({ mode: 'edit', tag })}>
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button type="button" className={[styles.tagAction, styles.tagActionDanger].join(' ')} aria-label={`Delete tag ${tag.label}`} onClick={() => handleDelete(tag)}>
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
          Add tag
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

function ActivePage({ section, activeTagId }: { section: Section; activeTagId: number | null }): React.ReactElement {
  switch (section) {
    case 'colours':     return <ColorsPage activeTagId={activeTagId} />
    case 'fonts':       return <FontsPage activeTagId={activeTagId} />
    case 'palettes':    return <PalettesPage activeTagId={activeTagId} />
    case 'type_scales': return <TypeScalesPage activeTagId={activeTagId} />
  }
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App(): React.ReactElement {
  const [activeSection, setActiveSection] = useState<Section>('colours')
  const [activeTagId, setActiveTagId] = useState<number | null>(null)

  function handleSectionChange(section: Section): void {
    setActiveSection(section)
    setActiveTagId(null)
  }

  const inTagView = activeTagId !== null

  return (
    <div className="app">
      <Sidebar
        activeSection={inTagView ? null : activeSection}
        onSectionChange={handleSectionChange}
        activeTagId={activeTagId}
        onTagSelect={setActiveTagId}
      />
      <main className="main">
        <div className="titlebar-inset" />
        {inTagView
          ? <TagView tagId={activeTagId!} />
          : <ActivePage section={activeSection} activeTagId={null} />}
      </main>
    </div>
  )
}
