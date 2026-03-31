import type {
  WorkspaceNote,
  OutlineItem,
  ItemMetadata,
  CreateNoteDto,
  UpdateNoteDto,
  CreateItemDto,
  UpdateItemDto,
  MoveItemDto,
  UpsertMetadataDto,
  PaginatedNotes,
  ItemTree,
  SearchResult,
} from 'shared-types';

const BASE_URL = (window as any).electron?.apiBase ?? import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:8787';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const hasBody = options?.body != null;
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw Object.assign(new Error(error.message ?? 'Request failed'), {
      status: response.status,
      code: error.code,
    });
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiClient = {
  notes: {
    list: () => request<PaginatedNotes>('/v1/notes'),
    create: (dto: CreateNoteDto) =>
      request<WorkspaceNote>('/v1/notes', { method: 'POST', body: JSON.stringify(dto) }),
    update: (noteId: string, dto: UpdateNoteDto) =>
      request<WorkspaceNote>(`/v1/notes/${noteId}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    delete: (noteId: string) =>
      request<void>(`/v1/notes/${noteId}`, { method: 'DELETE' }),
    items: (noteId: string) => request<ItemTree>(`/v1/notes/${noteId}/items`),
  },
  items: {
    create: (noteId: string, dto: CreateItemDto) =>
      request<OutlineItem>(`/v1/notes/${noteId}/items`, { method: 'POST', body: JSON.stringify(dto) }),
    update: (itemId: string, dto: UpdateItemDto) =>
      request<OutlineItem>(`/v1/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    delete: (itemId: string) =>
      request<void>(`/v1/items/${itemId}`, { method: 'DELETE' }),
    move: (itemId: string, dto: MoveItemDto) =>
      request<OutlineItem>(`/v1/items/${itemId}/move`, { method: 'POST', body: JSON.stringify(dto) }),
    indent: (itemId: string) =>
      request<OutlineItem>(`/v1/items/${itemId}/indent`, { method: 'POST' }),
    outdent: (itemId: string) =>
      request<OutlineItem>(`/v1/items/${itemId}/outdent`, { method: 'POST' }),
    getMetadata: (itemId: string) =>
      request<ItemMetadata>(`/v1/items/${itemId}/metadata`),
    upsertMetadata: (itemId: string, dto: UpsertMetadataDto) =>
      request<ItemMetadata>(`/v1/items/${itemId}/metadata`, { method: 'PUT', body: JSON.stringify(dto) }),
  },
  search: {
    query: (noteId: string, q: string) =>
      request<SearchResult>(`/v1/notes/${noteId}/search?q=${encodeURIComponent(q)}`),
  },
};
