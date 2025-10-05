
import type React from 'react';

export interface AppDefinition {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export interface ActiveWindow {
  id: string;
  title: string;
  content: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number, height: number };
}

export interface Photo {
  id: string;
  src: string;
}

export interface Widget {
    id: string;
    type: 'clock'; // Add other widget types here
    transform: string; // Store the full CSS transform string
}
