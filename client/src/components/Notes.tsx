import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useLocalStore } from '../hooks/useLocalStore';
import type { Note } from '../types';
import { formatTimestamp } from '../utils/time';

const createNote = (): Note => ({
  id: crypto.randomUUID(),
  title: 'New note',
  body: '',
  ts: Date.now(),
});

type NotesProps = {
  userId: string;
};

type EditorMode = 'edit' | 'preview';

const sortNotes = (notes: Note[]) => [...notes].sort((a, b) => b.ts - a.ts);

export default function Notes({ userId }: NotesProps) {
  const storageKey = `equinox:data:${userId}:notes`;
  const [notes, setNotes] = useLocalStore<Note[]>(storageKey, () => []);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<EditorMode>('edit');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSelectedId(sortNotes(notes)[0]?.id ?? null);
    }
  }, [notes, selectedId]);

  const sortedNotes = useMemo(() => sortNotes(notes), [notes]);

  const filteredNotes = useMemo(() => {
    if (!search) {
      return sortedNotes;
    }
    const query = search.toLowerCase();
    return sortedNotes.filter(
      (note) => note.title.toLowerCase().includes(query) || note.body.toLowerCase().includes(query),
    );
  }, [sortedNotes, search]);

  const selectedNote =
    filteredNotes.find((note) => note.id === selectedId) ??
    sortedNotes.find((note) => note.id === selectedId) ??
    filteredNotes[0] ??
    null;

  const handleCreate = useCallback(() => {
    const note = createNote();
    setNotes((prev) => [...prev, note]);
    setSelectedId(note.id);
    setMode('edit');
    setTimeout(() => bodyRef.current?.focus(), 0);
  }, [setNotes, setSelectedId, setMode, bodyRef]);

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    if (selectedId === id) {
      const remaining = filteredNotes.filter((note) => note.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  const updateNote = (fields: Partial<Note>) => {
    if (!selectedNote) return;
    setNotes((prev) =>
      prev.map((note) =>
        note.id === selectedNote.id
          ? {
              ...note,
              ...fields,
              ts: fields.body !== undefined || fields.title !== undefined ? Date.now() : note.ts,
            }
          : note,
      ),
    );
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleCreate();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
      }
      if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleCreate]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
      <aside className="flex flex-col gap-4 rounded-2xl bg-stone-900/60 p-4 ring-1 ring-stone-700/60">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes (/)"
              className="w-full rounded-xl border border-stone-700/60 bg-stone-950/70 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-amber-200"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-xl bg-amber-500/80 px-3 py-2 text-sm font-semibold text-stone-950 shadow hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            New
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto pr-1">
          {filteredNotes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-700/60 p-4 text-center text-sm text-stone-400">
              No notes yet. Press <kbd className="rounded bg-stone-800 px-1">Ctrl</kbd> + <kbd className="rounded bg-stone-800 px-1">N</kbd> to start.
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredNotes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(note.id)}
                    className={clsx(
                      'group flex w-full flex-col rounded-xl border border-stone-800/70 bg-stone-950/40 px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/70',
                      selectedId === note.id && 'border-amber-400/70 bg-stone-900/80 shadow-lg shadow-amber-500/10',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-amber-100 group-hover:text-amber-200">
                        {note.title || 'Untitled'}
                      </span>
                      <time className="shrink-0 text-[11px] uppercase tracking-wide text-stone-500">
                        {formatTimestamp(note.ts)}
                      </time>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-stone-400">{note.body || 'Empty note'}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="mt-auto flex flex-wrap gap-2 text-xs text-stone-400">
          <button
            type="button"
            onClick={() => alert('Export coming soon!')}
            className="rounded-full border border-stone-700/60 px-3 py-1 hover:border-amber-300 hover:text-amber-200"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => alert('Import coming soon!')}
            className="rounded-full border border-stone-700/60 px-3 py-1 hover:border-amber-300 hover:text-amber-200"
          >
            Import JSON
          </button>
        </div>
      </aside>

      <section className="flex h-full flex-col gap-4 rounded-2xl bg-stone-900/60 p-6 ring-1 ring-stone-700/60">
        {selectedNote ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(event) => updateNote({ title: event.target.value })}
                className="w-full rounded-xl border border-stone-700/60 bg-stone-950/70 px-4 py-2 text-lg font-semibold text-stone-100 focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                placeholder="Title"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
                  className="rounded-xl border border-stone-700/60 px-3 py-2 text-xs uppercase tracking-wide text-stone-300 hover:border-amber-300 hover:text-amber-200"
                >
                  {mode === 'edit' ? 'Preview (beta)' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedNote.id)}
                  className="rounded-xl border border-red-800/60 px-3 py-2 text-xs uppercase tracking-wide text-red-300 hover:border-red-500/80 hover:text-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
            {mode === 'edit' ? (
              <textarea
                ref={bodyRef}
                value={selectedNote.body}
                onChange={(event) => updateNote({ body: event.target.value })}
                className="min-h-[360px] flex-1 rounded-2xl border border-stone-700/60 bg-stone-950/70 px-4 py-3 text-sm leading-relaxed text-stone-100 focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                placeholder="Capture the season's whispers..."
              />
            ) : (
              <div className="min-h-[360px] flex-1 rounded-2xl border border-stone-700/60 bg-stone-950/70 px-4 py-3 text-sm leading-relaxed text-stone-100">
                <p className="mb-3 text-xs uppercase tracking-wide text-stone-400">Markdown preview is brewing ☕️</p>
                <pre className="whitespace-pre-wrap text-sm text-stone-200">{selectedNote.body || 'Nothing written yet.'}</pre>
              </div>
            )}
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-800/60 pt-3 text-xs text-stone-400">
              <span>Last updated {formatTimestamp(selectedNote.ts)}</span>
              <span>
                Tips: <kbd className="rounded bg-stone-800 px-1">Ctrl</kbd> + <kbd className="rounded bg-stone-800 px-1">S</kbd> saves automatically.
              </span>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-stone-400">
            <p className="text-lg font-medium">Start a new note to capture the season.</p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-4 rounded-full bg-amber-500/80 px-4 py-2 text-sm font-semibold text-stone-950 shadow hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              Create your first note
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
