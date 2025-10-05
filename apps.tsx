import React from 'react';
import { AppDefinition, Photo } from './types';
import {
  CameraIcon, PhotosIcon, DrawIcon, SettingsIcon, MicIcon, TranslateIcon
} from './assets/icons';
import { CameraContent } from './components/content/CameraContent';
import { PhotosContent } from './components/content/PhotosContent';
import { SettingsContent } from './components/content/SettingsContent';
import { DrawingContent } from './components/content/DrawingContent';
import { Transcriber } from './components/content/Transcriber';
import { Translator } from './components/content/Translator';

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
        id: 'transcriber',
        label: 'Transcriber',
        icon: <MicIcon />,
        content: <Transcriber />
    },
    {
        id: 'translator',
        label: 'Translator',
        icon: <TranslateIcon />,
        content: <Translator />
    },
    { 
        id: 'settings', 
        label: 'Settings', 
        icon: <SettingsIcon />, 
        content: <SettingsContent toggleVrMode={toggleVrMode} recenterView={recenterView} isVrMode={isVrMode} /> 
    },
];