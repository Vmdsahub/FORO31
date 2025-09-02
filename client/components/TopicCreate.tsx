import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import { modules, formats } from '../utils/quillConfig';
import '../styles/topic.css';

interface TopicCreateProps {
  onSave: (data: { delta: any; image: File | null }) => void;
  onCancel?: () => void;
  image?: File | null;
  onImageChange?: (image: File | null) => void;
}

export default function TopicCreate({ onSave, onCancel, image: externalImage, onImageChange }: TopicCreateProps) {
  const [delta, setDelta] = useState(null);
  const [image, setImage] = useState<File | null>(externalImage || null);
  const [characterCount, setCharacterCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuillChange = (content: string, delta: any, source: any, editor: any) => {
    const newDelta = editor.getContents();
    const text = editor.getText();
    const count = text.length - 1; // -1 para remover o \n final do Quill
    
    // Limitar a 5000 caracteres
    if (count <= 5000) {
      setDelta(newDelta);
      setCharacterCount(count);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    onImageChange?.(file);
  };

  return (
    <div className="topic-shell">
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleImageChange}
        className="hidden"
      />
      
      <ReactQuill 
        theme="snow" 
        value={delta} 
        onChange={handleQuillChange}
        modules={modules} 
        formats={formats} 
      />
      
      <div className="flex justify-between items-center pt-2 pb-4">
         <div className={`text-sm ${characterCount > 5000 ? 'text-red-500' : 'text-gray-500'}`}>
           {characterCount}/5000
         </div>
       </div>
      <div className="flex justify-end gap-2 pt-4">
        <button 
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={() => onSave({ delta, image })}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Publicar
        </button>
      </div>
    </div>
  );
}