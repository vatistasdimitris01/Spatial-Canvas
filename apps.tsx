
import React from 'react';
import { AppDefinition, Photo } from './types';
import {
  CameraIcon, PhotosIcon, DrawIcon, SettingsIcon
} from './assets/icons';
import { CameraContent } from './components/content/CameraContent';
import { PhotosContent } from './components/content/PhotosContent';
import { SettingsContent } from './components/content/SettingsContent';
import { DrawingContent } from './components/content/DrawingContent';

interface AppFactoryProps {
    closeWindow: () => void;
    photos: Photo[];
    takePhoto: () => void;
    toggleVrMode: () => void;
    recenterView: () => void;
    isVrMode: boolean;
}

export const getApps = ({ closeWindow, photos, takePhoto, toggleVrMode, recenterView, isVrMode }: AppFactoryProps): AppDefinition[] => [
    { 
        id: 'camera', 
        label: 'Camera', 
        icon: <CameraIcon />, 
        content: <CameraContent takePhoto={takePhoto} close={closeWindow} /> 
    },
    { 
        id: 'photos', 
        label: 'Photos', 
        icon: <PhotosIcon />, 
        content: <PhotosContent photos={photos} /> 
    },
    { 
        id: 'draw', 
        label: 'Draw', 
        icon: <DrawIcon />, 
        content: <DrawingContent />
    },
    { 
        id: 'settings', 
        label: 'Settings', 
        icon: <SettingsIcon />, 
        content: <SettingsContent toggleVrMode={toggleVrMode} recenterView={recenterView} isVrMode={isVrMode} /> 
    },
];
