import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client.js';
import type { ItemMetadata, MetadataPurpose } from 'shared-types';

interface MetadataPanelProps {
  itemId: string;
  onMetadataChange: (meta: ItemMetadata) => void;
}

const PURPOSES: MetadataPurpose[] = ['idea', 'task', 'question', 'decision', 'reference'];

export function MetadataPanel({ itemId, onMetadataChange }: MetadataPanelProps) {
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

  if (loading) return <div data-testid="metadata-panel" className="metadata-panel">Loading…</div>;

  return (
    <div data-testid="metadata-panel" className="metadata-panel">
      <h3>AI Context Metadata</h3>

      <label htmlFor="purpose-select">Purpose</label>
      <select
        id="purpose-select"
        data-testid="purpose-select"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value as MetadataPurpose)}
      >
        {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <label htmlFor="category-input">Category</label>
      <input
        id="category-input"
        data-testid="category-input"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        maxLength={60}
        placeholder="Category"
      />

      <div data-testid="tag-editor" className="tag-editor">
        <label>Tags</label>
        <div className="tag-list">
          {tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>×</button>
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
        />
      </div>

      <label htmlFor="context-note-input">Context Note</label>
      <textarea
        id="context-note-input"
        data-testid="context-note-input"
        value={contextNote}
        onChange={(e) => setContextNote(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Context for AI…"
      />

      <label htmlFor="confidence-input">Confidence (0-100)</label>
      <input
        id="confidence-input"
        data-testid="confidence-input"
        type="number"
        min={0}
        max={100}
        value={confidence ?? ''}
        onChange={(e) => setConfidence(e.target.value ? Number(e.target.value) : undefined)}
      />

      {error && <div className="error" role="alert">{error}</div>}

      <button data-testid="metadata-save-btn" type="button" onClick={handleSave}>
        Save Metadata
      </button>
    </div>
  );
}
