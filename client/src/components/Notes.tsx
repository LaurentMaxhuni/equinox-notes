import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    <div className="notes-layout">
      <aside className="notes-sidebar">
        <div className="notes-sidebar-controls">
          <div className="notes-search-wrapper">
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes (/)"
              className="input notes-search-input"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="notes-clear-button">
                Clear
              </button>
            )}
          </div>
          <button type="button" onClick={handleCreate} className="button button-primary button-compact">
            New
          </button>
        </div>

        <nav className="notes-list-wrapper">
          {filteredNotes.length === 0 ? (
            <p className="notes-empty">
              No notes yet. Press <kbd>Ctrl</kbd> + <kbd>N</kbd> to start.
            </p>
          ) : (
            <ul className="notes-list">
              {filteredNotes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(note.id)}
                    className={`notes-item${selectedId === note.id ? ' is-active' : ''}`}
                  >
                    <div className="notes-item-header">
                      <span className="notes-item-title">{note.title || 'Untitled'}</span>
                      <time className="notes-item-date">{formatTimestamp(note.ts)}</time>
                    </div>
                    <p className="notes-item-preview">{note.body || 'Empty note'}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="notes-footer-actions">
          <button type="button" onClick={() => alert('Export coming soon!')} className="button button-ghost button-compact">
            Export JSON
          </button>
          <button type="button" onClick={() => alert('Import coming soon!')} className="button button-ghost button-compact">
            Import JSON
          </button>
        </div>
      </aside>

      <section className="notes-editor">
        {selectedNote ? (
          <>
            <div className="notes-editor-toolbar">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(event) => updateNote({ title: event.target.value })}
                className="input notes-editor-title"
                placeholder="Title"
              />
              <div className="notes-mode-toggle">
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className={`notes-mode-button${mode === 'edit' ? ' is-active' : ''}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setMode('preview')}
                  className={`notes-mode-button${mode === 'preview' ? ' is-active' : ''}`}
                >
                  Preview
                </button>
                <button type="button" onClick={() => handleDelete(selectedNote.id)} className="button button-danger button-compact">
                  Delete
                </button>
              </div>
            </div>

            {mode === 'edit' ? (
              <textarea
                ref={bodyRef}
                value={selectedNote.body}
                onChange={(event) => updateNote({ body: event.target.value })}
                className="notes-editor-body"
                placeholder="Write something memorable..."
              />
            ) : (
              <div className="notes-preview" aria-live="polite">
                {selectedNote.body ? selectedNote.body.split('\n').map((line, index) => (
                  <p key={index} className="notes-preview-line">
                    {line || '\u00A0'}
                  </p>
                )) : (
                  <p className="notes-preview-placeholder">Nothing here yet. Add a few thoughts in edit mode.</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="notes-editor-empty">Select or create a note to begin.</div>
        )}
      </section>
    </div>
  );
}
