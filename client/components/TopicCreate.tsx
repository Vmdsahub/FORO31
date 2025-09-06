import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import { modules, formats } from '../utils/quillConfig';
import SecureUploadWidget, { UploadedFileInfo } from './SecureUploadWidget';
import VideoThumbnail from './VideoThumbnail';
import '../styles/topic.css';

interface TopicCreateProps {
  onSave: (data: { delta: any; image: File | null }) => void;
  onCancel?: () => void;
  image?: File | null;
  onImageChange?: (image: File | null) => void;
  hasError?: boolean;
  onContentChange?: () => void;
}

export default function TopicCreate({ onSave, onCancel, image: externalImage, onImageChange, hasError, onContentChange }: TopicCreateProps) {
  const [delta, setDelta] = useState('');
  const [image, setImage] = useState<File | null>(externalImage || null);
  const [characterCount, setCharacterCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);

  const handleQuillChange = (content: string, delta: any, source: any, editor: any) => {
    const newDelta = editor.getContents();
    const text = editor.getText();
    const count = text.length - 1; // -1 para remover o \n final do Quill
    
    // Limitar a 5000 caracteres
    if (count <= 5000) {
      setDelta(newDelta);
      setCharacterCount(count);
      onContentChange?.();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    onImageChange?.(file);
  };

  return (
    <div className={`topic-shell ${hasError ? 'error' : ''}`}>
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleImageChange}
        className="hidden"
      />
      
      <ReactQuill 
        ref={quillRef}
        theme="snow" 
        value={delta} 
        onChange={handleQuillChange}
        modules={modules} 
        formats={formats} 
      />
      
      <div className="flex justify-between items-center pt-2 pb-4">
        <div className="flex items-center gap-2">
          <SecureUploadWidget
            onSuccess={(fileInfo: UploadedFileInfo) => {
              console.log('Arquivo carregado:', fileInfo);
              // Inserir link do arquivo no editor
              if (quillRef.current) {
                const quill = quillRef.current.getEditor();
                const range = quill.getSelection();
                const index = range ? range.index : quill.getLength();
                
                // Detectar tipo de arquivo e inserir adequadamente
                const isVideo = fileInfo.mimeType?.startsWith('video/') || 
                               /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i.test(fileInfo.originalName);
                
                if (fileInfo.isImage) {
                  quill.insertEmbed(index, 'image', fileInfo.url);
                } else if (isVideo) {
                  // Para vídeos, inserir usando o blot customizado
                  const videoId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  quill.insertEmbed(index, 'video', {
                    id: videoId,
                    url: fileInfo.url,
                    filename: fileInfo.originalName
                  });
                } else {
                  quill.insertText(index, `📎 `);
                  quill.insertText(index + 2, fileInfo.originalName, 'link', fileInfo.url);
                  quill.insertText(index + 2 + fileInfo.originalName.length, `\n`);
                }
                
                // Atualizar o delta corretamente
                const newDelta = quill.getContents();
                setDelta(newDelta);
                onContentChange?.();
              }
            }}
            onError={(error) => console.error('Erro no upload:', error)}
            buttonText="📎 Upload"
            className="mr-2"
          />
        </div>
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