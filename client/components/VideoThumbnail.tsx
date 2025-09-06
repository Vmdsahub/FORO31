import React, { useState, useRef, useEffect } from 'react';
import { Play, X } from 'lucide-react';

interface VideoThumbnailProps {
  videoUrl: string;
  fileName: string;
  className?: string;
}

interface VideoModalProps {
  videoUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ videoUrl, fileName, isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X size={24} />
        </button>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-auto max-h-[90vh] rounded-lg"
          autoPlay
        >
          Seu navegador não suporta o elemento de vídeo.
        </video>
        <div className="text-white text-center mt-2 text-sm">
          {fileName}
        </div>
      </div>
    </div>
  );
};

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ videoUrl, fileName, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateThumbnail();
  }, [videoUrl]);

  const generateThumbnail = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    video.addEventListener('loadeddata', () => {
      // Seek to 1 second or 10% of video duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    });

    video.addEventListener('seeked', () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match video aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight;
      const maxWidth = 200;
      const maxHeight = 150;
      
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setThumbnailUrl(dataUrl);
    });

    video.load();
  };

  const handleThumbnailClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className={`relative inline-block cursor-pointer ${className}`} onClick={handleThumbnailClick}>
        {thumbnailUrl ? (
          <div className="relative">
            <img
              src={thumbnailUrl}
              alt={`Thumbnail do vídeo: ${fileName}`}
              className="max-w-[200px] max-h-[150px] w-auto h-auto border-radius-8px border border-gray-300 rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
              <div className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all">
                <Play size={24} className="text-gray-800 ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-[200px] h-[150px] bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play size={32} className="text-gray-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Carregando...</div>
            </div>
          </div>
        )}
        
        {/* Hidden video element for thumbnail generation */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="hidden"
          muted
          preload="metadata"
        />
        
        {/* Hidden canvas for thumbnail generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <VideoModal
        videoUrl={videoUrl}
        fileName={fileName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default VideoThumbnail;