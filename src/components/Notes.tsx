import { useEffect, useState } from 'react';

type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
};

const STORAGE_KEY = 'equinox_notes_v1';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to load notes', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes', e);
    }
  }, [notes]);

  function createNote() {
    if (!title.trim() && !body.trim()) return;
    const n: Note = { id: uid(), title: title.slice(0, 100), body, updatedAt: Date.now() };
    setNotes([n, ...notes]);
    setTitle('');
    setBody('');
  }

  function removeNote(id: string) {
    setNotes(notes.filter(n => n.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setTitle('');
      setBody('');
    }
  }

  function startEdit(n: Note) {
    setEditingId(n.id);
    setTitle(n.title);
    setBody(n.body);
  }

  function saveEdit() {
    if (!editingId) return;
    setNotes(notes.map(n => n.id === editingId ? { ...n, title: title.slice(0,100), body, updatedAt: Date.now() } : n));
    setEditingId(null);
    setTitle('');
    setBody('');
  }

  return (
    <section className="w-full max-w-3xl">
      <div className="mb-4 p-4 rounded-2xl bg-white/60 backdrop-blur-sm shadow-md">
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input aria-label="note-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-md p-2 border border-slate-200" />
        <label className="block mt-3 text-sm font-medium text-slate-700">Body</label>
        <textarea aria-label="note-body" value={body} onChange={e => setBody(e.target.value)} rows={4} className="mt-1 w-full rounded-md p-2 border border-slate-200" />
        <div className="mt-3 flex gap-2 justify-end">
          {editingId ? (
            <>
              <button onClick={() => { setEditingId(null); setTitle(''); setBody(''); }} className="px-3 py-2 rounded-md bg-slate-200">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-2 rounded-md bg-orange-500 text-white">Save</button>
            </>
          ) : (
            <button onClick={createNote} className="px-3 py-2 rounded-md bg-orange-500 text-white">Add Note</button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notes.length === 0 && (
          <div className="text-center text-slate-700/80">No notes yet — write something cozy ✨</div>
        )}
        {notes.map(n => (
          <article key={n.id} className="p-4 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-slate-800">{n.title || 'Untitled'}</h3>
                <p className="mt-1 text-sm text-slate-700/90 whitespace-pre-wrap">{n.body}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-slate-600">{new Date(n.updatedAt).toLocaleString()}</span>
                <div className="flex gap-2">
                  <button aria-label={`edit-${n.id}`} onClick={() => startEdit(n)} className="text-sm px-2 py-1 rounded bg-slate-100">Edit</button>
                  <button aria-label={`delete-${n.id}`} onClick={() => removeNote(n.id)} className="text-sm px-2 py-1 rounded bg-red-100 text-red-700">Delete</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
