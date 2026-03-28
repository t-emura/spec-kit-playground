import { useState, useEffect, useCallback, useRef } from 'react';
import { OutlineTree } from '../features/outliner/components/outline-tree.js';
import { useAutosave } from '../features/outliner/hooks/use-autosave.js';
import { HistoryStore } from '../features/outliner/stores/history-store.js';
import { MetadataPanel } from '../features/metadata/components/metadata-panel.js';
import { ExportDialog } from '../features/export/components/export-dialog.js';
import { SearchPanel } from '../features/search/components/search-panel.js';
import { apiClient } from '../lib/api-client.js';
import type { OutlineItem } from 'shared-types';

interface NoteWorkspaceProps {
  noteId: string;
  noteTitle: string;
  noteVersion: number;
}

export function NoteWorkspace({ noteId, noteTitle, noteVersion }: NoteWorkspaceProps) {
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [title, setTitle] = useState(noteTitle);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const historyRef = useRef(new HistoryStore());
  const { saveStatus, scheduleAutosave } = useAutosave({ noteId, version: noteVersion });

  useEffect(() => {
    apiClient.notes.items(noteId).then(({ items }) => {
      setItems(items);
      historyRef.current.push(items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [noteId]);

  // Ctrl+F opens search panel
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch((s) => !s);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleItemChange = useCallback(async (id: string, content: string) => {
    const updated = await apiClient.items.update(id, { content });
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...updated } : i));
      historyRef.current.push(next);
      return next;
    });
  }, []);

  const handleItemMove = useCallback(async (id: string, targetOrderIndex: number, targetParentId?: string | null) => {
    const moved = await apiClient.items.move(id, { targetOrderIndex, targetParentId });
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...moved } : i));
      historyRef.current.push(next);
      return next;
    });
  }, []);

  const handleItemDelete = useCallback(async (id: string) => {
    await apiClient.items.delete(id);
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id && i.parentId !== id);
      historyRef.current.push(next);
      return next;
    });
  }, []);

  const handleItemCreate = useCallback(async (
    afterId: string | null,
    depth: number,
    parentId: string | null,
  ): Promise<OutlineItem> => {
    const afterItem = afterId ? items.find((i) => i.id === afterId) : null;
    const orderIndex = afterItem ? afterItem.orderIndex + 1 : items.length;
    const created = await apiClient.items.create(noteId, { content: '', orderIndex, depth, parentId });
    setItems((prev) => {
      const next = [...prev, created].sort((a, b) => a.orderIndex - b.orderIndex);
      historyRef.current.push(next);
      return next;
    });
    setFocusItemId(created.id);
    return created;
  }, [noteId, items]);

  const handleItemIndent = useCallback(async (id: string): Promise<OutlineItem> => {
    const indented = await apiClient.items.indent(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...indented } : i)));
    setFocusItemId(id);
    return indented;
  }, []);

  const handleItemOutdent = useCallback(async (id: string): Promise<OutlineItem> => {
    const outdented = await apiClient.items.outdent(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...outdented } : i)));
    setFocusItemId(id);
    return outdented;
  }, []);

  const handleCollapseToggle = useCallback(async (id: string, collapsed: boolean) => {
    await apiClient.items.update(id, { isCollapsed: collapsed });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isCollapsed: collapsed } : i)));
  }, []);

  const handleOpenMetadata = useCallback((id: string) => {
    setSelectedItemId(id);
    setShowMetadata(true);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    scheduleAutosave({ title: e.target.value });
  };

  const handleUndo = () => {
    const prev = historyRef.current.undo();
    if (prev) setItems(prev);
  };

  const handleRedo = () => {
    const next = historyRef.current.redo();
    if (next) setItems(next);
  };

  if (loading) {
    return <div data-testid="note-workspace" className="note-workspace loading">Loading…</div>;
  }

  return (
    <div data-testid="note-workspace" data-note-id={noteId} className="note-workspace">
      <header className="workspace-header">
        <input
          data-testid="note-title-input"
          className="note-title-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title"
          aria-label="Note title"
        />
        <div className="workspace-actions">
          <button onClick={handleUndo} disabled={!historyRef.current.canUndo()} aria-label="Undo">↩</button>
          <button onClick={handleRedo} disabled={!historyRef.current.canRedo()} aria-label="Redo">↪</button>
          <button
            data-testid="export-note-btn"
            onClick={() => setShowExport(true)}
            aria-label="Export note"
          >⬇ Export</button>
          <span className="save-status" aria-live="polite">
            {saveStatus === 'saving' && '●'}
            {saveStatus === 'saved' && '✓'}
            {saveStatus === 'conflict' && '⚠ Conflict'}
            {saveStatus === 'error' && '✗ Error'}
          </span>
        </div>
      </header>

      {showSearch && (
        <SearchPanel
          noteId={noteId}
          onResultSelect={(itemId, q) => {
            setFocusItemId(itemId);
            setSearchQuery(q);
            setShowSearch(false);
          }}
        />
      )}

      {selectedItemId && showMetadata && (
        <MetadataPanel
          itemId={selectedItemId}
          onMetadataChange={() => setShowMetadata(false)}
        />
      )}

      <ExportDialog
        noteId={noteId}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />

      {items.length === 0 ? (
        <div data-testid="empty-outline-hint" className="empty-hint">
          <button data-testid="add-first-item" onClick={() => handleItemCreate(null, 0, null)}>
            + Add first item
          </button>
        </div>
      ) : (
        <OutlineTree
          items={items}
          focusItemId={focusItemId}
          searchQuery={searchQuery}
          onItemFocused={() => setFocusItemId(null)}
          onItemChange={handleItemChange}
          onItemMove={handleItemMove}
          onItemDelete={handleItemDelete}
          onItemCreate={handleItemCreate}
          onIndentItem={handleItemIndent}
          onOutdentItem={handleItemOutdent}
          onCollapseToggle={handleCollapseToggle}
          onOpenMetadata={handleOpenMetadata}
        />
      )}
    </div>
  );
}
