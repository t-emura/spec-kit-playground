import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  viewMode: text('view_mode', { enum: ['tree', 'focus'] }).notNull().default('tree'),
  version: integer('version').notNull().default(1),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  orderIndex: integer('order_index').notNull(),
  depth: integer('depth').notNull().default(0),
  content: text('content').notNull(),
  isCollapsed: integer('is_collapsed', { mode: 'boolean' }).notNull().default(false),
  highlightLevel: text('highlight_level', { enum: ['none', 'low', 'medium', 'high'] }).notNull().default('none'),
  status: text('status', { enum: ['active', 'done', 'blocked'] }).notNull().default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const itemMetadata = sqliteTable('item_metadata', {
  itemId: text('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  purpose: text('purpose', { enum: ['idea', 'task', 'question', 'decision', 'reference'] }).notNull(),
  category: text('category'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  contextNote: text('context_note'),
  confidence: integer('confidence'),
  updatedAt: text('updated_at').notNull(),
});

export const exportSnapshots = sqliteTable('export_snapshots', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  format: text('format', { enum: ['json', 'markdown'] }).notNull(),
  includeMetadata: integer('include_metadata', { mode: 'boolean' }).notNull().default(true),
  exportedBy: text('exported_by'),
  checksum: text('checksum').notNull(),
  payloadSizeBytes: integer('payload_size_bytes').notNull(),
  createdAt: text('created_at').notNull(),
});

// Relations
export const notesRelations = relations(notes, ({ many }) => ({
  items: many(items),
  exportSnapshots: many(exportSnapshots),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  note: one(notes, { fields: [items.noteId], references: [notes.id] }),
  parent: one(items, { fields: [items.parentId], references: [items.id], relationName: 'parent_child' }),
  children: many(items, { relationName: 'parent_child' }),
  metadata: one(itemMetadata, { fields: [items.id], references: [itemMetadata.itemId] }),
}));

export const itemMetadataRelations = relations(itemMetadata, ({ one }) => ({
  item: one(items, { fields: [itemMetadata.itemId], references: [items.id] }),
}));

export const exportSnapshotsRelations = relations(exportSnapshots, ({ one }) => ({
  note: one(notes, { fields: [exportSnapshots.noteId], references: [notes.id] }),
}));
