export const CURRENT_SCHEMA_VERSION = 2

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS colours (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL DEFAULT '',
    hex        TEXT    NOT NULL,
    favourite  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fonts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    family     TEXT    NOT NULL,
    category   TEXT    NOT NULL DEFAULT '',
    source     TEXT    NOT NULL DEFAULT 'google',
    source_url TEXT    NOT NULL DEFAULT '',
    weights    TEXT    NOT NULL DEFAULT '["400"]',
    favourite  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS palettes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    base_hex   TEXT    NOT NULL DEFAULT '',
    favourite  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS swatches (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    palette_id INTEGER NOT NULL REFERENCES palettes(id) ON DELETE CASCADE,
    hex        TEXT    NOT NULL,
    label      TEXT    NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    locked     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS type_scales (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    heading_font_id INTEGER REFERENCES fonts(id) ON DELETE SET NULL,
    body_font_id    INTEGER REFERENCES fonts(id) ON DELETE SET NULL,
    base_size       INTEGER NOT NULL DEFAULT 16,
    ratio           TEXT    NOT NULL DEFAULT '1.333',
    favourite       INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS type_scale_steps (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    type_scale_id  INTEGER NOT NULL REFERENCES type_scales(id) ON DELETE CASCADE,
    step_name      TEXT    NOT NULL,
    size           INTEGER NOT NULL,
    weight         INTEGER NOT NULL,
    line_height    TEXT    NOT NULL,
    letter_spacing TEXT    NOT NULL DEFAULT '0',
    sort_order     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tags (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    label  TEXT NOT NULL UNIQUE,
    colour TEXT NOT NULL DEFAULT '#6b7280'
  );

  CREATE TABLE IF NOT EXISTS asset_tags (
    asset_type TEXT    NOT NULL,
    asset_id   INTEGER NOT NULL,
    tag_id     INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (asset_type, asset_id, tag_id)
  );
`
