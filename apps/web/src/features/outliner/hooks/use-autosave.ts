import { useState, useCallback, useRef } from 'react';
import type { OutlineItem } from 'shared-types';
import { apiClient } from '../../../lib/api-client.js';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';

interface UseAutosaveOptions {
  noteId: string;
  version: number;
  debounceMs?: number;
}

interface AutosaveScheduleInput {
  title?: string;
  description?: string;
}

export function useAutosave({ noteId, version, debounceMs = 500 }: UseAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<AutosaveScheduleInput | null>(null);

  const scheduleAutosave = useCallback(
    (input: AutosaveScheduleInput) => {
      pendingRef.current = input;
      setSaveStatus('saving');

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const payload = pendingRef.current;
        if (!payload) return;

        try {
          await apiClient.notes.update(noteId, { ...payload, version });
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err: unknown) {
          const httpErr = err as { status?: number };
          if (httpErr?.status === 409) {
            setSaveStatus('conflict');
          } else {
            setSaveStatus('error');
          }
        }
      }, debounceMs);
    },
    [noteId, version, debounceMs],
  );

  return { saveStatus, scheduleAutosave };
}
