import type { OutlineItem, HighlightLevel, ItemStatus } from 'shared-types';

interface FocusToolbarProps {
  item: OutlineItem;
  onHighlightChange: (itemId: string, level: HighlightLevel) => void;
  onStatusChange?: (itemId: string, status: ItemStatus) => void;
}

const HIGHLIGHT_LEVELS: HighlightLevel[] = ['none', 'low', 'medium', 'high'];
const STATUSES: ItemStatus[] = ['active', 'done', 'blocked'];

const HIGHLIGHT_COLORS: Record<HighlightLevel, string> = {
  none: 'var(--color-text-muted)',
  low: 'var(--color-primary)',
  medium: 'var(--color-primary-hover)',
  high: 'var(--color-highlight-strip-high)',
};

const STATUS_ACTIVE_CLASSES: Record<ItemStatus, string> = {
  active: 'bg-primary text-white border-primary',
  done: 'bg-success text-white border-success',
  blocked: 'bg-danger text-white border-danger',
};

export function FocusToolbar({ item, onHighlightChange, onStatusChange }: FocusToolbarProps) {
  return (
    <div className="focus-toolbar flex items-center gap-4 px-4 py-2 border-t border-border bg-surface" role="toolbar" aria-label="Item focus controls">
      <div className="highlight-controls flex items-center gap-1" aria-label="Highlight level">
        {HIGHLIGHT_LEVELS.map((level) => (
          <button
            key={level}
            data-testid={`highlight-${level}`}
            aria-pressed={item.highlightLevel === level}
            aria-label={`Highlight ${level}`}
            title={`Highlight: ${level}`}
            onClick={() => onHighlightChange(item.id, level)}
            className="w-4 h-4 rounded-full transition-opacity"
            style={{
              backgroundColor: HIGHLIGHT_COLORS[level],
              opacity: item.highlightLevel === level ? 1 : 0.35,
            }}
          />
        ))}
      </div>

      <div className="status-controls flex items-center gap-1 ml-4" aria-label="Item status">
        {STATUSES.map((status) => {
          const isActive = item.status === status;
          return (
            <button
              key={status}
              data-testid={`status-${status}`}
              aria-pressed={isActive}
              aria-label={`Set status: ${status}`}
              onClick={() => onStatusChange?.(item.id, status)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                isActive ? STATUS_ACTIVE_CLASSES[status] : 'border-border text-text-muted hover:border-text-muted'
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>
    </div>
  );
}
