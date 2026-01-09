import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { useCanvas } from '@/hooks/useCanvas';
import { StickyNote } from './StickyNote';
import { NoteEditor } from './NoteEditor';
import { Toolbar } from './Toolbar';
import { Note, NoteColor } from '@/types/note';
import { cn } from '@/lib/utils';

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { notes, isLoaded, createNote, updateNote, deleteNote, bringToFront } = useNotes();
  const {
    canvasState,
    isPanning,
    isSpacePressed,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetView,
  } = useCanvas(canvasRef);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  // Handle double-click to create note
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current?.children[0]) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Calculate position relative to canvas with offset and scale
    const x = (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
    const y = (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale;
    
    const newNote = createNote(x - 120, y - 90); // Center the note at click position
    setSelectedNote(newNote);
  }, [canvasState, createNote]);

  const handleCreateNote = useCallback((color: NoteColor = 'yellow') => {
    // Create note in center of visible area
    const x = (window.innerWidth / 2 - canvasState.offsetX) / canvasState.scale - 120;
    const y = (window.innerHeight / 2 - canvasState.offsetY) / canvasState.scale - 90;
    const newNote = createNote(x, y, color);
    setSelectedNote(newNote);
  }, [canvasState, createNote]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // N - New note
      if (e.key === 'n' || e.key === 'N') {
        handleCreateNote();
      }

      // Delete - Remove selected note
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNote) {
        deleteNote(selectedNote.id);
        setSelectedNote(null);
      }

      // Escape - Close editor
      if (e.key === 'Escape' && selectedNote) {
        setSelectedNote(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateNote, deleteNote, selectedNote]);

  const handleSelectNote = useCallback((note: Note) => {
    setSelectedNote(note);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedNote(null);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas-bg">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas-bg">
      <Toolbar
        scale={canvasState.scale}
        onCreateNote={handleCreateNote}
        onResetView={resetView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div
        ref={canvasRef}
        className={cn(
          'w-full h-full',
          isPanning || isSpacePressed ? 'cursor-grab' : 'cursor-default',
          isPanning && 'cursor-grabbing'
        )}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onDoubleClick={handleDoubleClick}
      >
        {/* Canvas content with transform */}
        <div
          className="canvas-grid w-[10000px] h-[10000px] relative origin-top-left"
          style={{
            transform: `translate(${canvasState.offsetX}px, ${canvasState.offsetY}px) scale(${canvasState.scale})`,
          }}
        >
          {/* Render notes */}
          {filteredNotes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              scale={canvasState.scale}
              onUpdate={updateNote}
              onDelete={deleteNote}
              onSelect={handleSelectNote}
              onBringToFront={bringToFront}
            />
          ))}

          {/* Hidden notes indicator */}
          {searchQuery && filteredNotes.length !== notes.length && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-card rounded-lg shadow-soft text-sm text-muted-foreground">
              Showing {filteredNotes.length} of {notes.length} notes
            </div>
          )}
        </div>
      </div>

      {/* Note editor panel */}
      <NoteEditor
        note={selectedNote}
        onClose={handleCloseEditor}
        onUpdate={updateNote}
      />

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No notes yet</h2>
            <p className="text-muted-foreground">
              Double-click anywhere or press{' '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">N</kbd>{' '}
              to create a note
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
