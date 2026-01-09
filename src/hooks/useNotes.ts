import { useState, useEffect, useCallback } from 'react';
import { Note, NoteColor } from '@/types/note';

const API_URL = 'http://localhost:8000/api';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notes from backend
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch(`${API_URL}/notes`);
        if (!response.ok) throw new Error('Failed to fetch notes');
        const data = await response.json();
        // Map snake_case from backend to camelCase
        const mappedNotes: Note[] = data.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          x: note.x,
          y: note.y,
          width: note.width,
          height: note.height,
          color: note.color,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
        }));
        setNotes(mappedNotes);
        setError(null);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Could not connect to backend. Make sure your Python server is running on localhost:8000');
      } finally {
        setIsLoaded(true);
      }
    };

    fetchNotes();
  }, []);

  const createNote = useCallback(async (x: number, y: number, color: NoteColor = 'yellow') => {
    const newNote: Note = {
      id: generateId(),
      title: '',
      content: '',
      x,
      y,
      width: 240,
      height: 180,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic update
    setNotes(prev => [...prev, newNote]);

    try {
      await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
    } catch (err) {
      console.error('Error creating note:', err);
      // Rollback on error
      setNotes(prev => prev.filter(n => n.id !== newNote.id));
    }

    return newNote;
  }, []);

  const updateNote = useCallback(async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    // Optimistic update
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: Date.now() }
        : note
    ));

    try {
      await fetch(`${API_URL}/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating note:', err);
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    
    // Optimistic update
    setNotes(prev => prev.filter(note => note.id !== id));

    try {
      await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting note:', err);
      // Rollback on error
      if (noteToDelete) {
        setNotes(prev => [...prev, noteToDelete]);
      }
    }
  }, [notes]);

  const bringToFront = useCallback((id: string) => {
    setNotes(prev => {
      const note = prev.find(n => n.id === id);
      if (!note) return prev;
      return [...prev.filter(n => n.id !== id), note];
    });
  }, []);

  return {
    notes,
    isLoaded,
    error,
    createNote,
    updateNote,
    deleteNote,
    bringToFront,
  };
}
