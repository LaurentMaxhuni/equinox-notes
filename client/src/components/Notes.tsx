import ReactMarkdown from 'react-markdown';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSelectedId(sortNotes(notes)[0]?.id ?? null);
    }
  }, [notes, selectedId]);

  const sortedNotes = useMemo(() => sortNotes(notes), [notes]);

  const filteredNotes = useMemo(() => {
    if (!search.trim()) {
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
  }, [setNotes]);

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

  const touchSelectedNote = useCallback(() => {
    if (!selectedNote) return;
    setNotes((prev) =>
      prev.map((note) => (note.id === selectedNote.id ? { ...note, ts: Date.now() } : note)),
    );
  }, [selectedNote, setNotes]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handleCreate();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        touchSelectedNote();
      }
      if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleCreate, touchSelectedNote]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equinox-notes-${userId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid format');
      }
      const normalized: Note[] = parsed
        .map((note) => ({
          id: typeof note.id === 'string' ? note.id : crypto.randomUUID(),
          title: typeof note.title === 'string' ? note.title : 'Imported note',
          body: typeof note.body === 'string' ? note.body : '',
          ts: typeof note.ts === 'number' ? note.ts : Date.now(),
        }))
        .filter(Boolean);
      setNotes(normalized);
      setSelectedId(normalized[0]?.id ?? null);
    } catch (error) {
      console.warn('Failed to import notes', error);
      window.alert('Could not import notes. Please ensure the file is a valid Equinox Notes export.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-[minmax(260px,320px)_1fr] lg:gap-8">
      <aside className="glass-card flex flex-col gap-4 px-4 py-5 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes (/)"
              className="surface-input pr-10 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-2 my-auto rounded-lg bg-stone-800/80 px-2 text-xs text-stone-300"
              >
                Clear
              </button>
            )}
          </div>
          <button type="button" onClick={handleCreate} className="surface-button px-4 py-2 text-sm">
            New
          </button>
        </div>

        <nav className="max-h-[50vh] overflow-y-auto pr-1">
          {filteredNotes.length === 0 ? (
            <p className="rounded-xl bg-stone-950/40 px-3 py-8 text-center text-sm text-stone-400">
              No notes yet. Press <kbd className="rounded bg-stone-800 px-1 text-xs">Ctrl</kbd> +
              <kbd className="ml-1 rounded bg-stone-800 px-1 text-xs">N</kbd> to begin.
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredNotes.map((note) => {
                const isActive = selectedNote?.id === note.id;
                return (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(note.id)}
                      className={`w-full rounded-xl px-3 py-3 text-left transition ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/50'
                          : 'bg-stone-950/30 text-stone-300 hover:bg-stone-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-stone-400">
                        <span>{formatTimestamp(note.ts)}</span>
                        <span>{note.body.length} chars</span>
                      </div>
                      <p className="mt-2 text-base font-medium text-stone-100">
                        {note.title || 'Untitled note'}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-stone-400">
                        {note.body || 'Empty note'}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-300">
          <button type="button" onClick={handleExport} className="surface-button secondary flex-1 justify-center">
            Export JSON
          </button>
          <button type="button" onClick={handleImportClick} className="surface-button secondary flex-1 justify-center">
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </aside>

      <section className="glass-card flex min-h-[420px] flex-1 flex-col overflow-hidden px-5 py-6">
        {selectedNote ? (
          <>
            <div className="flex flex-col gap-3 border-b border-stone-700/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(event) => updateNote({ title: event.target.value })}
                className="surface-input text-lg font-medium"
                placeholder="Title"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className={`surface-button secondary px-3 py-2 text-sm ${mode === 'edit' ? 'ring-amber-400/80' : ''}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setMode('preview')}
                  className={`surface-button secondary px-3 py-2 text-sm ${mode === 'preview' ? 'ring-amber-400/80' : ''}`}
                >
                  Preview
                </button>
                <button type="button" onClick={() => handleDelete(selectedNote.id)} className="surface-button danger px-3 py-2 text-sm">
                  Delete
                </button>
              </div>
            </div>

            {mode === 'edit' ? (
              <textarea
                ref={bodyRef}
                value={selectedNote.body}
                onChange={(event) => updateNote({ body: event.target.value })}
                className="mt-4 h-full min-h-[280px] flex-1 resize-none rounded-2xl border border-stone-800/60 bg-stone-950/50 p-4 text-base leading-relaxed text-stone-100 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                placeholder="Write something memorable..."
              />
            ) : (
              <div className="markdown-preview prose prose-invert mt-4 flex-1 overflow-y-auto rounded-2xl bg-stone-950/40 p-4">
                {selectedNote.body ? (
                  <ReactMarkdown>{selectedNote.body}</ReactMarkdown>
                ) : (
                  <p className="text-sm text-stone-400">Nothing here yet. Add a few thoughts in edit mode.</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-stone-400">
            Select or create a note to begin.
          </div>
        )}
      </section>
    </div>
  );
}
