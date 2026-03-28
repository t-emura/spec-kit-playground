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
    <div className="home-page">
      <h1>My Notes</h1>
      <button
        data-testid="new-note-btn"
        onClick={() => setShowForm(true)}
        aria-label="Create new note"
      >
        + New Note
      </button>

      {showForm && (
        <div className="new-note-form">
          <input
            data-testid="note-title-input"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button
            data-testid="note-create-submit"
            onClick={handleCreate}
            disabled={creating}
          >
            Create
          </button>
          <button onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id}>
              <button onClick={() => navigate(`/notes/${note.id}`)}>
                {note.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
