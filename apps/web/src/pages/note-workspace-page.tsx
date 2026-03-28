import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NoteWorkspace } from './note-workspace.js';
import { apiClient } from '../lib/api-client.js';
import type { WorkspaceNote } from 'shared-types';

export function NoteWorkspacePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<WorkspaceNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!noteId) return;
    apiClient.notes.list()
      .then(({ items }) => {
        const found = items.find((n) => n.id === noteId);
        setNote(found ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [noteId]);

  if (loading) return <div>Loading…</div>;
  if (!note) return <div>Note not found. <button onClick={() => navigate('/')}>Go home</button></div>;

  return (
    <div>
      <nav>
        <button onClick={() => navigate('/')} aria-label="Back to notes">← Notes</button>
      </nav>
      <NoteWorkspace noteId={note.id} noteTitle={note.title} noteVersion={note.version} />
    </div>
  );
}
