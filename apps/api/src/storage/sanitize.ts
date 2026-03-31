// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

export function sanitizeFileName(title: string): string {
  let sanitized = title.replace(UNSAFE_CHARS, '').replace(/^[\s.]+|[\s.]+$/g, '');
  if (sanitized.length === 0) sanitized = 'untitled';
  if (sanitized.length > 200) sanitized = sanitized.slice(0, 200);
  return sanitized;
}

export function buildNoteFileName(id: string, title: string): string {
  return `${id}-${sanitizeFileName(title)}.json`;
}

export function extractNoteIdFromFileName(fileName: string): string | null {
  // UUID v4 pattern at the start of the filename
  const match = fileName.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i,
  );
  return match ? match[1]! : null;
}
