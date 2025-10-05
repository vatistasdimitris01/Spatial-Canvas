
import React from 'react';
import { AppDefinition, Photo } from './types';
import {
  CameraIcon, PhotosIcon, DrawIcon
} from './assets/icons';
import { PhotosContent } from './components/content/PhotosContent';
import { DrawingContent } from './components/content/DrawingContent';

interface AppFactoryProps {
    photos: Photo[];
}

export const getApps = ({ photos }: AppFactoryProps): AppDefinition[] => {
    const PhotosApp = () => <PhotosContent photos={photos} />;

    return [
        { 
            id: 'camera', 
            label: 'Camera', 
            icon: <CameraIcon />, 
            content: PhotosApp
        },
        { 
            id: 'photos', 
            label: 'Photos', 
            icon: <PhotosIcon />, 
            content: PhotosApp
        },
        { 
            id: 'draw', 
            label: 'Draw', 
            icon: <DrawIcon />, 
            content: DrawingContent
        },
    ];
};
