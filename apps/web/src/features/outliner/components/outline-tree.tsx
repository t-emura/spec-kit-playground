import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { OutlineItem } from 'shared-types';

interface OutlineTreeProps {
  items: OutlineItem[];
  focusItemId?: string | null;
  onItemFocused?: () => void;
  onItemChange: (id: string, content: string) => Promise<void>;
  onItemMove: (id: string, targetOrderIndex: number, targetParentId?: string | null) => Promise<void>;
  onItemDelete: (id: string) => Promise<void>;
  onItemCreate: (afterId: string | null, depth: number, parentId: string | null) => Promise<OutlineItem>;
  onIndentItem?: (id: string) => Promise<OutlineItem>;
  onOutdentItem?: (id: string) => Promise<OutlineItem>;
  onCollapseToggle?: (id: string, collapsed: boolean) => Promise<void>;
  onOpenMetadata?: (id: string) => void;
  searchQuery?: string;
}

function isHidden(items: OutlineItem[], item: OutlineItem): boolean {
  if (!item.parentId) return false;
  let parentId: string | null = item.parentId;
  while (parentId) {
    const parent = items.find((i) => i.id === parentId);
    if (!parent) break;
    if (parent.isCollapsed) return true;
    parentId = parent.parentId;
  }
  return false;
}

export function OutlineTree({
  items,
  focusItemId,
  onItemFocused,
  onItemChange,
  onItemMove: _onItemMove,
  onItemDelete,
  onItemCreate,
  onIndentItem,
  onOutdentItem,
  onCollapseToggle,
  onOpenMetadata,
  searchQuery,
}: OutlineTreeProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Auto-focus an item when focusItemId changes or items re-render
  useEffect(() => {
    if (focusItemId && inputRefs.current[focusItemId]) {
      inputRefs.current[focusItemId]?.focus();
      onItemFocused?.();
    }
  }, [focusItemId, items, onItemFocused]);

  const visibleItems = items.filter((item) => !isHidden(items, item));

  const handleBlur = useCallback(
    async (item: OutlineItem) => {
      if (editingId === item.id && editingContent !== item.content) {
        await onItemChange(item.id, editingContent);
      }
      setEditingId(null);
    },
    [editingId, editingContent, onItemChange],
  );

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent, item: OutlineItem) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await onItemCreate(item.id, item.depth, item.parentId);
      } else if (e.key === 'Backspace' && editingContent === '') {
        e.preventDefault();
        await onItemDelete(item.id);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          await onOutdentItem?.(item.id);
        } else {
          await onIndentItem?.(item.id);
        }
      }
    },
    [editingContent, onItemCreate, onItemDelete, onIndentItem, onOutdentItem],
  );

  return (
    <div className="outline-tree py-2" role="tree" aria-label="Outline editor">
      {visibleItems.map((item) => {
        const hasChildren = items.some((i) => i.parentId === item.id);
        const isMatched =
          searchQuery && item.content.toLowerCase().includes(searchQuery.toLowerCase());

        return (
          <div
            key={item.id}
            data-testid={`outline-item-${item.id}`}
            data-content={item.content}
            data-depth={String(item.depth)}
            data-highlight={item.highlightLevel}
            role="treeitem"
            className={`outline-item group depth-${item.depth} highlight-${item.highlightLevel} flex items-center gap-2 py-1 border-l-4${isMatched ? ' search-match bg-[color:var(--color-highlight-low)]' : ''}`}
            style={{ paddingLeft: `calc(${item.depth} * var(--spacing-indent, 1.5rem) + 0.75rem)` }}
          >
            {hasChildren && (
              <button
                data-testid={`collapse-toggle-${item.id}`}
                className="collapse-toggle text-xs text-text-muted w-4 h-4 flex-shrink-0 flex items-center justify-center hover:text-text transition-colors"
                aria-label={item.isCollapsed ? 'Expand' : 'Collapse'}
                onClick={() => onCollapseToggle?.(item.id, !item.isCollapsed)}
              >
                {item.isCollapsed ? '▶' : '▼'}
              </button>
            )}
            {!hasChildren && <span className="collapse-spacer w-4 flex-shrink-0" />}

            <input
              ref={(el) => { inputRefs.current[item.id] = el; }}
              className="item-input flex-1 bg-transparent border-none outline-none text-sm text-text caret-primary"
              type="text"
              role="textbox"
              aria-label={`Edit item: ${item.content}`}
              value={editingId === item.id ? editingContent : item.content}
              onFocus={() => {
                setEditingId(item.id);
                setEditingContent(item.content);
              }}
              onChange={(e) => setEditingContent(e.target.value)}
              onBlur={() => handleBlur(item)}
              onKeyDownCapture={(e) => {
                if (e.key === 'Tab') e.preventDefault();
              }}
              onKeyDown={(e) => handleKeyDown(e, item)}
            />

            <div className="item-menu-wrapper relative">
              <button
                data-testid="item-menu-btn"
                className="item-menu-btn opacity-0 group-hover:opacity-100 text-text-muted px-1 hover:text-text transition-opacity"
                aria-label="Item actions"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === item.id ? null : item.id);
                }}
              >
                ⋮
              </button>
              {menuOpenId === item.id && (
                <div className="item-menu-popup absolute right-0 bg-surface-2 border border-border rounded-md shadow-lg py-1 z-10" role="menu">
                  <button
                    data-testid="open-metadata-btn"
                    role="menuitem"
                    className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-surface transition-colors"
                    onClick={() => {
                      setMenuOpenId(null);
                      onOpenMetadata?.(item.id);
                    }}
                  >
                    Metadata
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
