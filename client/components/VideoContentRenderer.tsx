import React from 'react';
import VideoThumbnail from './VideoThumbnail';

interface VideoContentRendererProps {
  content: string;
  className?: string;
}

const VideoContentRenderer: React.FC<VideoContentRendererProps> = ({ content, className = '' }) => {
  // Função para processar o conteúdo e substituir placeholders de vídeo
  const processContent = (htmlContent: string) => {
    // Regex para encontrar placeholders de vídeo: [VIDEO:id:url:filename]
    const videoRegex = /\[VIDEO:([^:]+):([^:]+):([^\]]+)\]/g;
    
    // Dividir o conteúdo em partes, separando texto normal de placeholders de vídeo
    const parts: (string | { type: 'video'; id: string; url: string; filename: string })[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = videoRegex.exec(htmlContent)) !== null) {
      // Adicionar texto antes do placeholder
      if (match.index > lastIndex) {
        const textBefore = htmlContent.slice(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(textBefore);
        }
      }
      
      // Adicionar placeholder de vídeo
      parts.push({
        type: 'video',
        id: match[1],
        url: decodeURIComponent(match[2]),
        filename: decodeURIComponent(match[3])
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Adicionar texto restante
    if (lastIndex < htmlContent.length) {
      const textAfter = htmlContent.slice(lastIndex);
      if (textAfter.trim()) {
        parts.push(textAfter);
      }
    }
    
    return parts;
  };

  const parts = processContent(content);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          // Renderizar HTML normal
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        } else if (part.type === 'video') {
          // Renderizar componente de vídeo
          return (
            <div key={part.id}>
              <VideoThumbnail
                videoUrl={part.url}
                fileName={part.filename}
                className="block"
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default VideoContentRenderer;