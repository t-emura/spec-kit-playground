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

  if (loading) return <div className="text-sm text-text-muted p-6">Loading…</div>;
  if (!note) return (
    <div className="text-sm text-text-muted p-6">
      Note not found.{' '}
      <button onClick={() => navigate('/')} className="btn-ghost">Go home</button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-bg">
      <nav className="flex items-center px-4 py-2 border-b border-border bg-surface">
        <button onClick={() => navigate('/')} aria-label="Back to notes" className="btn-ghost text-sm">
          ← Notes
        </button>
      </nav>
      <div className="flex-1 overflow-hidden">
        <NoteWorkspace noteId={note.id} noteTitle={note.title} noteVersion={note.version} />
      </div>
    </div>
  );
}
