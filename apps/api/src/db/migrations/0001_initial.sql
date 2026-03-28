-- Migration: 0001_initial
-- Creates foundational tables for Modern Thinking Outliner

CREATE TABLE IF NOT EXISTS notes (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL CHECK(length(trim(title)) > 0 AND length(title) <= 120),
  description TEXT CHECK(description IS NULL OR length(description) <= 500),
  view_mode   TEXT NOT NULL DEFAULT 'tree' CHECK(view_mode IN ('tree', 'focus')),
  version     INTEGER NOT NULL DEFAULT 1,
  archived    INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0, 1)),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id              TEXT PRIMARY KEY,
  note_id         TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  parent_id       TEXT REFERENCES items(id) ON DELETE CASCADE,
  order_index     INTEGER NOT NULL,
  depth           INTEGER NOT NULL DEFAULT 0 CHECK(depth >= 0 AND depth <= 10),
  content         TEXT NOT NULL DEFAULT '' CHECK(length(content) <= 2000),
  is_collapsed    INTEGER NOT NULL DEFAULT 0 CHECK(is_collapsed IN (0, 1)),
  highlight_level TEXT NOT NULL DEFAULT 'none' CHECK(highlight_level IN ('none','low','medium','high')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','done','blocked')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS item_metadata (
  item_id      TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  purpose      TEXT NOT NULL CHECK(purpose IN ('idea','task','question','decision','reference')),
  category     TEXT CHECK(category IS NULL OR length(category) <= 60),
  tags         TEXT NOT NULL DEFAULT '[]',
  context_note TEXT CHECK(context_note IS NULL OR length(context_note) <= 2000),
  confidence   INTEGER CHECK(confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS export_snapshots (
  id                TEXT PRIMARY KEY,
  note_id           TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  format            TEXT NOT NULL CHECK(format IN ('json','markdown')),
  include_metadata  INTEGER NOT NULL DEFAULT 1 CHECK(include_metadata IN (0,1)),
  exported_by       TEXT,
  checksum          TEXT NOT NULL,
  payload_size_bytes INTEGER NOT NULL CHECK(payload_size_bytes > 0),
  created_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_note_id ON items(note_id);
CREATE INDEX IF NOT EXISTS idx_items_parent_id ON items(parent_id);
CREATE INDEX IF NOT EXISTS idx_items_note_order ON items(note_id, order_index);
CREATE INDEX IF NOT EXISTS idx_export_snapshots_note_id ON export_snapshots(note_id);
