import { useState, useEffect, useCallback } from 'react';
import { Note, NoteColor } from '@/types/note';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = 'http://localhost:8000/api';

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Get auth headers
  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  // Fetch notes from backend
  useEffect(() => {
    const fetchNotes = async () => {
      if (!token) {
        setIsLoaded(true);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/notes`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error('Failed to fetch notes');
        }
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
        setError(err instanceof Error ? err.message : 'Could not connect to backend. Make sure your Python server is running on localhost:8000');
      } finally {
        setIsLoaded(true);
      }
    };

    fetchNotes();
  }, [token, getAuthHeaders]);

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
        headers: getAuthHeaders(),
        body: JSON.stringify(newNote),
      });
    } catch (err) {
      console.error('Error creating note:', err);
      // Rollback on error
      setNotes(prev => prev.filter(n => n.id !== newNote.id));
    }

    return newNote;
  }, [getAuthHeaders]);

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
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating note:', err);
    }
  }, [getAuthHeaders]);

  const deleteNote = useCallback(async (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    
    // Optimistic update
    setNotes(prev => prev.filter(note => note.id !== id));

    try {
      await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting note:', err);
      // Rollback on error
      if (noteToDelete) {
        setNotes(prev => [...prev, noteToDelete]);
      }
    }
  }, [notes, getAuthHeaders]);

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
