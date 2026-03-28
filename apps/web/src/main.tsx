import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/tokens.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Lazy load pages
const HomePage = React.lazy(() => import('./pages/home-page.js').then(m => ({ default: m.HomePage })));
const NoteWorkspacePage = React.lazy(() => import('./pages/note-workspace-page.js').then(m => ({ default: m.NoteWorkspacePage })));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<React.Suspense fallback={<div>Loading…</div>}><HomePage /></React.Suspense>} />
          <Route path="/notes/:noteId" element={<React.Suspense fallback={<div>Loading…</div>}><NoteWorkspacePage /></React.Suspense>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
