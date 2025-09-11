import React from 'react';
import ReactQuill from 'react-quill';
import { modules, formats } from '../utils/quillConfig';

import '../styles/topic.css';

interface TopicViewProps {
  delta: any;
  imageUrl?: string;
}

function TopicView({ delta, imageUrl }: TopicViewProps) {


  return (
    <div className="topic-shell topic-view">
      {imageUrl && (
        <img 
          src={imageUrl} 
          className="rounded-2xl mb-4 w-auto max-h-96 object-cover" 
          alt="" 
        />
      )}
      <ReactQuill 
        theme="snow" 
        value={delta} 
        readOnly 
        modules={{ ...modules, toolbar: false }} 
        formats={formats} 
      />
    </div>
  );
}

export { TopicView };
export default TopicView;