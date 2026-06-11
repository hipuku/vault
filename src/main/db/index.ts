import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { CREATE_TABLES, CURRENT_SCHEMA_VERSION } from './schema'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'vault.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    const version = db.pragma('user_version', { simple: true }) as number
    if (version < CURRENT_SCHEMA_VERSION) {
      // Schema version bump — drop all tables and recreate cleanly
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
