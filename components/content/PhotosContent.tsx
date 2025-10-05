
import React from 'react';
import { Photo } from '../../types';

interface PhotosContentProps {
  photos: Photo[];
}

export const PhotosContent: React.FC<PhotosContentProps> = ({ photos }) => {
  return (
    <div className="w-full h-full p-4">
      {photos.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-white/70">
          <p className="text-xl">No photos taken yet. Use the Camera app!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.slice().reverse().map(photo => (
            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden shadow-lg">
              <img src={photo.src} alt="A captured photo" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
