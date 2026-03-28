/** Shared domain types and DTOs for the Modern Thinking Outliner */

export type ViewMode = 'tree' | 'focus';
export type HighlightLevel = 'none' | 'low' | 'medium' | 'high';
export type ItemStatus = 'active' | 'done' | 'blocked';
export type MetadataPurpose = 'idea' | 'task' | 'question' | 'decision' | 'reference';
export type ExportFormat = 'json' | 'markdown';

export interface WorkspaceNote {
  id: string;
  title: string;
  description?: string;
  viewMode: ViewMode;
  version: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutlineItem {
  id: string;
  noteId: string;
  parentId: string | null;
  orderIndex: number;
  depth: number;
  content: string;
  isCollapsed: boolean;
  highlightLevel: HighlightLevel;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ItemMetadata {
  itemId: string;
  purpose: MetadataPurpose;
  category?: string;
  tags: string[];
  contextNote?: string;
  confidence?: number;
  updatedAt: string;
}

export interface ExportSnapshot {
  id: string;
  noteId: string;
  format: ExportFormat;
  includeMetadata: boolean;
  exportedBy?: string;
  checksum: string;
  payloadSizeBytes: number;
  createdAt: string;
}

// DTOs for API requests
export interface CreateNoteDto {
  title: string;
  description?: string;
}

export interface UpdateNoteDto {
  title?: string;
  description?: string;
  viewMode?: ViewMode;
  version: number;
}

export interface CreateItemDto {
  parentId?: string | null;
  content: string;
  orderIndex: number;
  depth: number;
}

export interface UpdateItemDto {
  content?: string;
  isCollapsed?: boolean;
  highlightLevel?: HighlightLevel;
  status?: ItemStatus;
}

export interface MoveItemDto {
  targetParentId?: string | null;
  targetOrderIndex: number;
}

export interface UpsertMetadataDto {
  purpose: MetadataPurpose;
  category?: string;
  tags: string[];
  contextNote?: string;
  confidence?: number;
}

export interface ExportNoteDto {
  format: ExportFormat;
  includeMetadata: boolean;
}

// API response types
export interface PaginatedNotes {
  items: WorkspaceNote[];
}

export interface ItemTree {
  items: OutlineItem[];
}

export interface SearchResult {
  items: Array<OutlineItem & { metadata?: ItemMetadata }>;
  query: string;
  total: number;
}

export interface ExportResult {
  snapshot: ExportSnapshot;
  payload: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
