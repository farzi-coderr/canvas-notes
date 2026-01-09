import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Note, NoteColor } from '@/types/note';
import { Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyNoteProps {
  note: Note;
  scale: number;
  onUpdate: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onSelect: (note: Note) => void;
  onBringToFront: (id: string) => void;
}

const colorClasses: Record<NoteColor, string> = {
  yellow: 'note-yellow',
  pink: 'note-pink',
  blue: 'note-blue',
  green: 'note-green',
  lavender: 'note-lavender',
  coral: 'note-coral',
};

export function StickyNote({
  note,
  scale,
  onUpdate,
  onDelete,
  onSelect,
  onBringToFront,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, noteX: 0, noteY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLButtonElement) return;
    if ((e.target as HTMLElement).dataset.resize) return;
    
    e.stopPropagation();
    onBringToFront(note.id);
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      noteX: note.x,
      noteY: note.y,
    };
  }, [note.id, note.x, note.y, onBringToFront]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onBringToFront(note.id);
    
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: note.width,
      height: note.height,
    };
  }, [note.id, note.width, note.height, onBringToFront]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - dragStartRef.current.x) / scale;
        const deltaY = (e.clientY - dragStartRef.current.y) / scale;
        
        onUpdate(note.id, {
          x: dragStartRef.current.noteX + deltaX,
          y: dragStartRef.current.noteY + deltaY,
        });
      }
      
      if (isResizing) {
        const deltaX = (e.clientX - resizeStartRef.current.x) / scale;
        const deltaY = (e.clientY - resizeStartRef.current.y) / scale;
        
        const newWidth = Math.max(180, resizeStartRef.current.width + deltaX);
        const newHeight = Math.max(120, resizeStartRef.current.height + deltaY);
        
        onUpdate(note.id, {
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, note.id, scale, onUpdate]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLButtonElement) return;
    if (!isDragging) {
      onSelect(note);
    }
  }, [isDragging, note, onSelect]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  }, [note.id, onDelete]);

  return (
    <div
      ref={noteRef}
      className={cn(
        'sticky-note absolute cursor-pointer no-select',
        colorClasses[note.color],
        isDragging && 'dragging cursor-grabbing',
        'animate-pop'
      )}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with drag handle */}
      <div className="flex items-center justify-between p-3 pb-1">
        <div className="flex items-center gap-1.5 text-foreground/40">
          <GripVertical className="w-4 h-4" />
        </div>
        <button
          onClick={handleDelete}
          className={cn(
            'p-1.5 rounded-lg transition-all duration-200',
            'hover:bg-destructive/10 text-foreground/30 hover:text-destructive',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 flex flex-col h-[calc(100%-44px)]">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1 min-h-[24px]">
          {note.title || 'Untitled'}
        </h3>
        <p className="text-sm text-foreground/70 line-clamp-4 flex-1 whitespace-pre-wrap">
          {note.content || 'Click to edit...'}
        </p>
      </div>

      {/* Resize handle */}
      <div
        data-resize="true"
        className={cn(
          'absolute bottom-1 right-1 w-4 h-4 cursor-se-resize',
          'opacity-0 transition-opacity',
          isHovered && 'opacity-40'
        )}
        onMouseDown={handleResizeStart}
      >
        <svg viewBox="0 0 16 16" className="w-full h-full fill-foreground">
          <path d="M14 14H12V12H14V14ZM14 10H12V8H14V10ZM10 14H8V12H10V14Z" />
        </svg>
      </div>
    </div>
  );
}
