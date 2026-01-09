export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'lavender' | 'coral';

export interface Note {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: NoteColor;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
}
