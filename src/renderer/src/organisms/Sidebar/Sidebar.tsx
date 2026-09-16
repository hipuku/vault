import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faPalette, faFont, faSwatchbook, faTextHeight, faPlus, faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import type { Section, TagWithCount } from '@shared/types'
import { useConfirm } from '../../hooks/useConfirm'
import { Button } from '../../atoms/Button/Button'
import { Divider } from '../../atoms/Divider/Divider'
import { Logo } from '../../atoms/Logo/Logo'
import { ConfirmDialog } from '../../molecules/ConfirmDialog/ConfirmDialog'
import { TagModal } from '../TagModal/TagModal'
import styles from './Sidebar.module.css'

/** The four sections, in rail order. App reads this for its command palette. */
export const NAV_ITEMS: Array<{ section: Section; label: string; icon: IconDefinition }> = [
  { section: 'colours', label: 'Colors', icon: faPalette },
  { section: 'fonts', label: 'Fonts', icon: faFont },
  { section: 'palettes', label: 'Palettes', icon: faSwatchbook },
  { section: 'type_scales', label: 'Type Scales', icon: faTextHeight },
]

type TagModalState = { mode: 'create' } | { mode: 'edit'; tag: TagWithCount }

interface SidebarProps {
  /** Null while a project is open: the rail highlights the project, not a section. */
  activeSection: Section | null
  onSectionChange: (s: Section) => void
  activeTagId: number | null
  onTagSelect: (id: number | null) => void
  tags: TagWithCount[]
  createTag: (label: string, colour: string) => Promise<TagWithCount>
  updateTag: (id: number, label: string, colour: string) => Promise<void>
  deleteTag: (id: number) => Promise<void>
}

/**
 * The app's navigation rail: the wordmark, the four sections, the projects, and
 * the button that makes one. It owns the project modal and the delete confirm,
 * because both belong to the rows they act on.
 *
 * It lived inside App until now, which was the only organism in the app without
 * its own folder, stylesheet or test.
 */
export function Sidebar({
  activeSection,
  onSectionChange,
  activeTagId,
  onTagSelect,
  tags,
  createTag,
  updateTag,
  deleteTag,
}: SidebarProps): React.ReactElement {
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
      title: `Delete “${tag.label}”?`,
      message: used
        ? `It’s on ${tag.count} ${tag.count === 1 ? 'item' : 'items'} and will be removed from ${tag.count === 1 ? 'it' : 'them'}. This can’t be undone.`
        : `This project isn’t used yet. This can’t be undone.`,
      confirmLabel: 'Delete project',
    })
    if (ok) {
      if (activeTagId === tag.id) onTagSelect(null)
      await deleteTag(tag.id)
    }
  }

  return (
    <nav className="sidebar" aria-label="Sections and projects">
      <div className="titlebar-inset" />

      <div className={styles.brand}>
        <Logo className={styles.brandWordmark} />
      </div>

      {NAV_ITEMS.map(({ section, label, icon }) => (
        <button
          key={section}
          type="button"
          /* The rail is the app's navigation, so the row you are on says so
             rather than only looking different. */
          aria-current={activeSection === section ? 'page' : undefined}
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
                  aria-current={activeTagId === tag.id ? 'page' : undefined}
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
        kind={confirm.kind}
        onConfirm={confirm.onConfirm}
        onCancel={confirm.onCancel}
      />
    </nav>
  )
}
