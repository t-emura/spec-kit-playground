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
    } catch (e) {
      setError('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div data-testid="export-dialog" role="dialog" aria-modal="true" aria-label="Export note">
      <h2>Export Note</h2>

      <fieldset>
        <legend>Format</legend>
        <label>
          <input
            data-testid="format-json"
            type="radio"
            name="format"
            value="json"
            checked={format === 'json'}
            onChange={() => setFormat('json')}
          />
          JSON
        </label>
        <label>
          <input
            data-testid="format-markdown"
            type="radio"
            name="format"
            value="markdown"
            checked={format === 'markdown'}
            onChange={() => setFormat('markdown')}
          />
          Markdown
        </label>
      </fieldset>

      <label>
        <input
          data-testid="include-metadata-toggle"
          type="checkbox"
          checked={includeMetadata}
          onChange={(e) => setIncludeMetadata(e.target.checked)}
        />
        Include Metadata
      </label>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div data-testid="export-success" className="success">Export successful!</div>}

      <button
        data-testid="export-submit-btn"
        type="button"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? 'Exporting…' : 'Export'}
      </button>

      <button data-testid="export-close-btn" type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
