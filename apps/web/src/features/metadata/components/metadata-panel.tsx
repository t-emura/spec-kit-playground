import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client.js';
import type { ItemMetadata, MetadataPurpose } from 'shared-types';

interface MetadataPanelProps {
  itemId: string;
  onMetadataChange: (meta: ItemMetadata) => void;
  className?: string;
}

const PURPOSES: MetadataPurpose[] = ['idea', 'task', 'question', 'decision', 'reference'];

export function MetadataPanel({ itemId, onMetadataChange, className }: MetadataPanelProps) {
  const [loading, setLoading] = useState(true);
  const [purpose, setPurpose] = useState<MetadataPurpose>('idea');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [contextNote, setContextNote] = useState('');
  const [confidence, setConfidence] = useState<number | undefined>();
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.items.getMetadata(itemId)
      .then((meta) => {
        if (meta) {
          setPurpose(meta.purpose);
          setCategory(meta.category ?? '');
          setTags(meta.tags);
          setContextNote(meta.contextNote ?? '');
          setConfidence(meta.confidence);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [itemId]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSave = async () => {
    setError('');
    try {
      const meta = await apiClient.items.upsertMetadata(itemId, {
        purpose,
        category: category || undefined,
        tags,
        contextNote: contextNote || undefined,
        confidence,
      });
      onMetadataChange(meta);
    } catch {
      setError('Failed to save metadata');
    }
  };

  const panelClass = `bg-surface border-t border-border md:border-t-0 md:border-l p-6 flex flex-col gap-5 overflow-y-auto${className ? ` ${className}` : ''}`;

  if (loading) return <div data-testid="metadata-panel" className={panelClass}>Loading…</div>;

  return (
    <div data-testid="metadata-panel" className={panelClass}>
      <h3 className="text-base font-semibold text-text">AI Context Metadata</h3>

      <div className="flex flex-col gap-1">
        <label htmlFor="purpose-select" className="text-xs font-medium text-text-muted uppercase tracking-wide">Purpose</label>
        <select
          id="purpose-select"
          data-testid="purpose-select"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as MetadataPurpose)}
          className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text focus:border-primary outline-none"
        >
          {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category-input" className="text-xs font-medium text-text-muted uppercase tracking-wide">Category</label>
        <input
          id="category-input"
          data-testid="category-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={60}
          placeholder="Category"
          className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary outline-none"
        />
      </div>

      <div data-testid="tag-editor" className="tag-editor flex flex-col gap-1">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Tags</label>
        <div className="tag-list flex flex-wrap gap-1 mb-1">
          {tags.map((tag) => (
            <span key={tag} className="tag inline-flex items-center gap-1 px-2 py-0.5 bg-surface-2 border border-border rounded-full text-xs text-text">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="text-text-muted hover:text-danger transition-colors ml-0.5"
              >×</button>
            </span>
          ))}
        </div>
        <input
          data-testid="tag-input"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="Add tag…"
          aria-label="Add tag"
          className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="context-note-input" className="text-xs font-medium text-text-muted uppercase tracking-wide">Context Note</label>
        <textarea
          id="context-note-input"
          data-testid="context-note-input"
          value={contextNote}
          onChange={(e) => setContextNote(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Context for AI…"
          className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary outline-none resize-none leading-relaxed"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confidence-input" className="text-xs font-medium text-text-muted uppercase tracking-wide">Confidence (0–100)</label>
        <input
          id="confidence-input"
          data-testid="confidence-input"
          type="number"
          min={0}
          max={100}
          value={confidence ?? ''}
          onChange={(e) => setConfidence(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text focus:border-primary outline-none"
        />
      </div>

      {error && <div className="error text-xs text-danger" role="alert">{error}</div>}

      <button data-testid="metadata-save-btn" type="button" onClick={handleSave} className="btn-primary w-full mt-1">
        Save Metadata
      </button>
    </div>
  );
}
