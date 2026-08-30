import Database from 'better-sqlite3'
import { app } from 'electron'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'
import { CREATE_TABLES, CURRENT_SCHEMA_VERSION } from './schema'

let db: Database.Database

/** True if the file holds anything worth keeping. A fresh install has tables but no rows. */
function isPopulated(handle: Database.Database): boolean {
  const tables = handle
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)
    .all() as Array<{ name: string }>
  return tables.some(t => {
    const row = handle.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get() as { n: number }
    return row.n > 0
  })
}

/** Copy the database beside itself, stamped with the schema it was written by. */
function backUp(dbPath: string, fromVersion: number): void {
  if (!existsSync(dbPath)) return
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  copyFileSync(dbPath, `${dbPath}.v${fromVersion}.${stamp}.bak`)
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'vault.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    const version = db.pragma('user_version', { simple: true }) as number

    // A newer file than this build understands: queries would fail one by one with
    // "no such column". Stop here instead, with the reason.
    if (version > CURRENT_SCHEMA_VERSION) {
      throw new Error(
        `This library was written by a newer version of Vault (schema ${version}, ` +
          `this build understands ${CURRENT_SCHEMA_VERSION}). Update Vault to open it.`,
      )
    }

    if (version < CURRENT_SCHEMA_VERSION) {
      // The recreate below is destructive: it drops every table. Keep a copy of the
      // file first so a schema bump can never be the reason someone loses a library
      // they spent months building. There are no migrations yet; when there are, they
      // replace this branch and the backup becomes the fallback rather than the plan.
      if (isPopulated(db)) backUp(dbPath, version)
      db.pragma('foreign_keys = OFF')
      db.exec(`
        DROP TABLE IF EXISTS asset_tags;
        DROP TABLE IF EXISTS palette_tags;
        DROP TABLE IF EXISTS type_scale_steps;
        DROP TABLE IF EXISTS type_scales;
        DROP TABLE IF EXISTS swatches;
        DROP TABLE IF EXISTS palettes;
        DROP TABLE IF EXISTS fonts;
        DROP TABLE IF EXISTS colours;
        DROP TABLE IF EXISTS tags;
      `)
      db.exec(CREATE_TABLES)
      db.pragma('foreign_keys = ON')
      db.pragma(`user_version = ${CURRENT_SCHEMA_VERSION}`)
    }
  }
  return db
}
