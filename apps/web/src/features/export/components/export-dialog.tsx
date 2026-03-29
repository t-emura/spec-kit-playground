import { useState } from 'react';
import { apiClient } from '../../../lib/api-client.js';
import type { ExportFormat } from 'shared-types';

interface ExportDialogProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ noteId, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const result = await apiClient.notes.export(noteId, { format, includeMetadata });
      const blob = new Blob(
        [result.payload],
        { type: format === 'json' ? 'application/json' : 'text/markdown' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${noteId}.${format === 'json' ? 'json' : 'md'}`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch {
      setError('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div data-testid="export-dialog" role="dialog" aria-modal="true" aria-label="Export note" className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm flex flex-col gap-4 mx-4">
        <h2 className="text-base font-semibold text-text">Export Note</h2>

        <fieldset className="flex flex-col gap-2 border-none p-0">
          <legend className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Format</legend>
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input
              data-testid="format-json"
              type="radio"
              name="format"
              value="json"
              checked={format === 'json'}
              onChange={() => setFormat('json')}
              className="accent-primary"
            />
            JSON
          </label>
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input
              data-testid="format-markdown"
              type="radio"
              name="format"
              value="markdown"
              checked={format === 'markdown'}
              onChange={() => setFormat('markdown')}
              className="accent-primary"
            />
            Markdown
          </label>
        </fieldset>

        <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
          <input
            data-testid="include-metadata-toggle"
            type="checkbox"
            checked={includeMetadata}
            onChange={(e) => setIncludeMetadata(e.target.checked)}
            className="accent-primary"
          />
          Include Metadata
        </label>

        {error && <div className="text-xs text-danger" role="alert">{error}</div>}
        {success && <div data-testid="export-success" className="text-xs text-success">Export successful!</div>}

        <button
          data-testid="export-submit-btn"
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary w-full"
        >
          {exporting ? 'Exporting…' : 'Export'}
        </button>

        <button
          data-testid="export-close-btn"
          type="button"
          onClick={onClose}
          className="btn-ghost w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}
