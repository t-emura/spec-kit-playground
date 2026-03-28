import type { OutlineItem, HighlightLevel, ItemStatus } from 'shared-types';

interface FocusToolbarProps {
  item: OutlineItem;
  onHighlightChange: (itemId: string, level: HighlightLevel) => void;
  onStatusChange?: (itemId: string, status: ItemStatus) => void;
}

const HIGHLIGHT_LEVELS: HighlightLevel[] = ['none', 'low', 'medium', 'high'];
const STATUSES: ItemStatus[] = ['active', 'done', 'blocked'];

const HIGHLIGHT_COLORS: Record<HighlightLevel, string> = {
  none: '#94a3b8',
  low: '#6366f1',
  medium: '#818cf8',
  high: '#a5b4fc',
};

export function FocusToolbar({ item, onHighlightChange, onStatusChange }: FocusToolbarProps) {
  return (
    <div className="focus-toolbar" role="toolbar" aria-label="Item focus controls">
      <div className="highlight-controls" aria-label="Highlight level">
        {HIGHLIGHT_LEVELS.map((level) => (
          <button
            key={level}
            data-testid={`highlight-${level}`}
            aria-pressed={item.highlightLevel === level}
            aria-label={`Highlight ${level}`}
            title={`Highlight: ${level}`}
            onClick={() => onHighlightChange(item.id, level)}
            style={{
              backgroundColor: HIGHLIGHT_COLORS[level],
              opacity: item.highlightLevel === level ? 1 : 0.4,
            }}
          >
            {level === 'none' ? '○' : '●'}
          </button>
        ))}
      </div>

      <div className="status-controls" aria-label="Item status">
        {STATUSES.map((status) => (
          <button
            key={status}
            data-testid={`status-${status}`}
            aria-pressed={item.status === status}
            aria-label={`Set status: ${status}`}
            onClick={() => onStatusChange?.(item.id, status)}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
