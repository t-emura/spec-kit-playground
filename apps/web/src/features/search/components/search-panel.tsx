import { useState, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client.js';
import type { OutlineItem } from 'shared-types';

interface SearchPanelProps {
  noteId: string;
  onResultSelect: (itemId: string, query: string) => void;
}

export function SearchPanel({ noteId, onResultSelect }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OutlineItem[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(
    async (value: string) => {
      setQuery(value);
      if (!value.trim()) {
        setResults([]);
        setTotal(0);
        return;
      }
      setSearching(true);
      try {
        const result = await apiClient.search.query(noteId, value);
        setResults(result.items);
        setTotal(result.total);
      } finally {
        setSearching(false);
      }
    },
    [noteId],
  );

  return (
    <div className="search-panel bg-surface border-b border-border px-6 py-3" role="search" aria-label="Search outline">
      <input
        role="searchbox"
        type="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search…"
        aria-label="Search items"
        autoFocus
        className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary"
      />

      {query && (
        <div className="search-result-count text-xs text-text-muted mt-1" aria-live="polite">
          {searching ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''}`}
        </div>
      )}

      <ul className="search-results mt-2 space-y-1 max-h-48 overflow-y-auto list-none p-0 m-0" role="listbox">
        {results.map((item) => (
          <li
            key={item.id}
            className="search-result-item px-3 py-2 rounded-md text-sm text-text hover:bg-surface-2 cursor-pointer transition-colors"
            role="option"
            aria-selected={false}
            onClick={() => onResultSelect(item.id, query)}
          >
            <span className="result-content">{item.content}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
