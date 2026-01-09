import { useState, useEffect, useCallback } from 'react';
import { Note, NoteColor } from '@/types/note';

const STORAGE_KEY = 'whiteboard-notes';

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultNotes: Note[] = [
  {
    id: generateId(),
    title: 'Welcome! 👋',
    content: 'Double-click anywhere on the canvas to create a new note, or press N on your keyboard.',
    x: 100,
    y: 100,
    width: 240,
    height: 180,
    color: 'yellow',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    title: 'Tips & Tricks',
    content: '• Drag notes to move them\n• Click to edit\n• Use the color picker\n• Press Delete to remove',
    x: 380,
    y: 150,
    width: 240,
    height: 200,
    color: 'blue',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    title: 'Pan & Zoom',
    content: 'Hold Space + drag to pan the canvas. Use scroll wheel to zoom in/out.',
    x: 200,
    y: 340,
    width: 220,
    height: 160,
    color: 'green',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load notes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotes(parsed);
      } catch {
        setNotes(defaultNotes);
      }
    } else {
      setNotes(defaultNotes);
    }
    setIsLoaded(true);
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isLoaded]);

  const createNote = useCallback((x: number, y: number, color: NoteColor = 'yellow') => {
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
    setNotes(prev => [...prev, newNote]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: Date.now() }
        : note
    ));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  }, []);

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
    createNote,
    updateNote,
    deleteNote,
    bringToFront,
  };
}
