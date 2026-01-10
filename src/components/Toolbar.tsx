import React from 'react';
import { Plus, Maximize, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NoteColor } from '@/types/note';
import { UserMenu } from './UserMenu';

interface ToolbarProps {
  scale: number;
  onCreateNote: (color?: NoteColor) => void;
  onResetView: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
  yellow: 'bg-note-yellow hover:bg-note-yellow/80',
  pink: 'bg-note-pink hover:bg-note-pink/80',
  blue: 'bg-note-blue hover:bg-note-blue/80',
  green: 'bg-note-green hover:bg-note-green/80',
  lavender: 'bg-note-lavender hover:bg-note-lavender/80',
  coral: 'bg-note-coral hover:bg-note-coral/80',
};

export function Toolbar({ scale, onCreateNote, onResetView, searchQuery, onSearchChange }: ToolbarProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
      {/* Main toolbar */}
      <div className={cn(
        'flex items-center gap-1 px-2 py-1.5',
        'bg-card/95 backdrop-blur-md rounded-xl shadow-soft',
        'border border-border'
      )}>
        {/* New note button with color picker */}
        <div className="relative group">
          <button
            onClick={() => onCreateNote('yellow')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors',
              'font-medium text-sm'
            )}
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
          
          {/* Color dropdown */}
          <div className={cn(
            'absolute top-full left-0 mt-1 p-2',
            'bg-card rounded-xl shadow-hover border border-border',
            'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
            'transition-all duration-200',
            'flex gap-1.5'
          )}>
            {colorOptions.map(({ color, label }) => (
              <button
                key={color}
                title={label}
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateNote(color);
                }}
                className={cn(
                  'w-6 h-6 rounded-full transition-transform hover:scale-110',
                  colorClasses[color]
                )}
              />
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className={cn(
              'pl-8 pr-3 py-2 w-48',
              'bg-muted/50 rounded-lg border-none',
              'text-sm placeholder:text-muted-foreground/70',
              'focus:outline-none focus:ring-2 focus:ring-ring/20',
              'transition-all focus:w-56'
            )}
          />
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onResetView}
            className={cn(
              'p-2 rounded-lg text-muted-foreground',
              'hover:bg-muted hover:text-foreground transition-colors'
            )}
            title="Reset view"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-muted-foreground px-2 min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <div className="w-px h-6 bg-border mx-1" />

        {/* User menu */}
        <UserMenu />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className={cn(
        'hidden lg:flex items-center gap-2 px-3 py-2',
        'bg-card/80 backdrop-blur-sm rounded-xl',
        'text-xs text-muted-foreground',
        'border border-border'
      )}>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">N</kbd>
        <span>New</span>
        <span className="mx-1">•</span>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Space</kbd>
        <span>Pan</span>
      </div>
    </div>
  );
}
