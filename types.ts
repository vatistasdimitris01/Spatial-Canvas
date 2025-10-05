
import type React from 'react';

export type DisplayMode = 'AR' | 'VR' | 'MR';

export interface AppDefinition {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ComponentType<any>;
}

export interface ActiveWindow {
  id: string;
  title: string;
  content: React.ComponentType<any>;
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
