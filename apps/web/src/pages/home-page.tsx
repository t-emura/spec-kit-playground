import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client.js';
import type { WorkspaceNote } from 'shared-types';

export function HomePage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<WorkspaceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    apiClient.notes.list()
      .then(({ items }) => { setNotes(items); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const note = await apiClient.notes.create({ title: newTitle.trim() });
      navigate(`/notes/${note.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-text mb-6">My Notes</h1>

        {!showForm && (
          <button
            data-testid="new-note-btn"
            onClick={() => setShowForm(true)}
            aria-label="Create new note"
            className="btn-primary mb-6"
          >
            + New Note
          </button>
        )}

        {showForm && (
          <div className="new-note-form flex gap-2 mb-6 items-center">
            <input
              data-testid="note-title-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="flex-1 bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary"
            />
            <button
              data-testid="note-create-submit"
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : (
          <ul className="note-list space-y-2 list-none p-0 m-0">
            {notes.map((note) => (
              <li key={note.id} className="bg-surface border border-border rounded-md">
                <button
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-text hover:bg-surface-2 rounded-md transition-colors"
                >
                  {note.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
