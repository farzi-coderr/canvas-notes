import React, { useState, useEffect, useCallback } from 'react';
import { Note, NoteColor } from '@/types/note';
import { X, Type, List, Heading1 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  note: Note | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
}

const colorOptions: { color: NoteColor; label: string }[] = [
  { color: 'yellow', label: 'Yellow' },
  { color: 'pink', label: 'Pink' },
  { color: 'blue', label: 'Blue' },
  { color: 'green', label: 'Green' },
  { color: 'lavender', label: 'Lavender' },
  { color: 'coral', label: 'Coral' },
];

const colorClasses: Record<NoteColor, string> = {
  yellow: 'bg-note-yellow',
  pink: 'bg-note-pink',
  blue: 'bg-note-blue',
  green: 'bg-note-green',
  lavender: 'bg-note-lavender',
  coral: 'bg-note-coral',
};

export function NoteEditor({ note, onClose, onUpdate }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSelectedColor(note.color);
    }
  }, [note]);

  // Auto-save on changes
  useEffect(() => {
    if (!note) return;
    
    const timeoutId = setTimeout(() => {
      onUpdate(note.id, { title, content, color: selectedColor });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [title, content, selectedColor, note, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const insertBullet = useCallback(() => {
    setContent(prev => {
      const lines = prev.split('\n');
      const lastLine = lines[lines.length - 1];
      if (lastLine.startsWith('• ')) {
        return prev;
      }
      return prev + (prev && !prev.endsWith('\n') ? '\n' : '') + '• ';
    });
  }, []);

  if (!note) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Editor Panel */}
      <div 
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-lg z-50',
          'bg-card shadow-drag rounded-l-2xl',
          'animate-slide-up origin-right',
          'flex flex-col'
        )}
        style={{
          animation: 'slideInRight 0.3s ease-out',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b border-border',
          colorClasses[selectedColor],
          'rounded-tl-2xl'
        )}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground/70">Editing note</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-foreground/10 transition-colors"
          >
            <X className="w-5 h-5 text-foreground/70" />
          </button>
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <span className="text-sm text-muted-foreground mr-2">Color:</span>
          {colorOptions.map(({ color, label }) => (
            <button
              key={color}
              title={label}
              onClick={() => setSelectedColor(color)}
              className={cn(
                'w-7 h-7 rounded-full transition-all duration-200',
                colorClasses[color],
                selectedColor === color 
                  ? 'ring-2 ring-foreground/30 ring-offset-2 ring-offset-card scale-110' 
                  : 'hover:scale-110'
              )}
            />
          ))}
        </div>

        {/* Formatting toolbar */}
        <div className="flex items-center gap-1 p-3 border-b border-border">
          <button 
            onClick={insertBullet}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Add bullet point"
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Bold (select text)"
          >
            <Type className="w-4 h-4 font-bold" />
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Heading"
          >
            <Heading1 className="w-4 h-4" />
          </button>
        </div>

        {/* Title input */}
        <div className="p-4 pb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className={cn(
              'w-full text-xl font-semibold bg-transparent',
              'border-none outline-none focus:ring-0',
              'placeholder:text-muted-foreground/50'
            )}
            autoFocus
          />
        </div>

        {/* Content textarea */}
        <div className="flex-1 p-4 pt-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            className={cn(
              'w-full h-full resize-none bg-transparent',
              'border-none outline-none focus:ring-0',
              'placeholder:text-muted-foreground/50',
              'text-foreground/90 leading-relaxed',
              'scrollbar-thin'
            )}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          <span>Auto-saved</span>
          <span className="mx-2">•</span>
          <span>Press Esc to close</span>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
