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
    <div className="search-panel" role="search" aria-label="Search outline">
      <input
        role="searchbox"
        type="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search…"
        aria-label="Search items"
        autoFocus
      />

      {query && (
        <div className="search-result-count" aria-live="polite">
          {searching ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''}`}
        </div>
      )}

      <ul className="search-results" role="listbox">
        {results.map((item) => (
          <li
            key={item.id}
            className="search-result-item"
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
