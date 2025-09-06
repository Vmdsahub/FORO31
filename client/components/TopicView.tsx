import React from 'react';
import ReactQuill from 'react-quill';
import { modules, formats } from '../utils/quillConfig';
import VideoContentRenderer from './VideoContentRenderer';
import '../styles/topic.css';

interface TopicViewProps {
  delta: any;
  imageUrl?: string;
}

function TopicView({ delta, imageUrl }: TopicViewProps) {
  // Converter delta para HTML para verificar se há vídeos
  const getHtmlContent = () => {
    if (typeof delta === 'string') {
      return delta;
    }
    // Se delta é um objeto Quill, criar uma instância temporária para converter
    const tempDiv = document.createElement('div');
    const tempQuill = new (window as any).Quill(tempDiv, { theme: 'snow' });
    tempQuill.setContents(delta);
    return tempQuill.root.innerHTML;
  };

  const htmlContent = typeof delta === 'string' ? delta : '';
  const hasVideos = htmlContent.includes('[VIDEO:');

  return (
    <div className="topic-shell topic-view">
      {imageUrl && (
        <img 
          src={imageUrl} 
          className="rounded-2xl mb-4 w-auto max-h-96 object-cover" 
          alt="" 
        />
      )}
      {hasVideos ? (
        <VideoContentRenderer 
          content={htmlContent}
          className="ql-editor"
        />
      ) : (
        <ReactQuill 
          theme="snow" 
          value={delta} 
          readOnly 
          modules={{ ...modules, toolbar: false }} 
          formats={formats} 
        />
      )}
    </div>
  );
}

export { TopicView };
export default TopicView;