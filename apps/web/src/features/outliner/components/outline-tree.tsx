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
  onItemMove,
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
    <div className="outline-tree" role="tree" aria-label="Outline editor">
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
            className={`outline-item depth-${item.depth} highlight-${item.highlightLevel}${isMatched ? ' search-match' : ''}`}
            style={{ paddingLeft: `calc(${item.depth} * var(--spacing-indent, 1.5rem))` }}
          >
            {hasChildren && (
              <button
                data-testid={`collapse-toggle-${item.id}`}
                className="collapse-toggle"
                aria-label={item.isCollapsed ? 'Expand' : 'Collapse'}
                onClick={() => onCollapseToggle?.(item.id, !item.isCollapsed)}
              >
                {item.isCollapsed ? '▶' : '▼'}
              </button>
            )}
            {!hasChildren && <span className="collapse-spacer" />}

            <input
              ref={(el) => { inputRefs.current[item.id] = el; }}
              className="item-input"
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
                // Prevent Tab's default focus movement in capture phase
                if (e.key === 'Tab') e.preventDefault();
              }}
              onKeyDown={(e) => handleKeyDown(e, item)}
            />

            <div className="item-menu-wrapper">
              <button
                data-testid="item-menu-btn"
                className="item-menu-btn"
                aria-label="Item actions"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === item.id ? null : item.id);
                }}
              >
                ⋮
              </button>
              {menuOpenId === item.id && (
                <div className="item-menu-popup" role="menu">
                  <button
                    data-testid="open-metadata-btn"
                    role="menuitem"
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
