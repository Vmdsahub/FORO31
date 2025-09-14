import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { modules, formats } from '../utils/quillConfig';
import SecureUploadWidget, { UploadedFileInfo } from './SecureUploadWidget';

import ImageModal from './ImageModal';
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
  const [modalVideo, setModalVideo] = useState<{ src: string; alt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const uploadWidgetRef = useRef<HTMLButtonElement>(null);

  // Escutar evento customizado da toolbar e configurar observer de imagens
  useEffect(() => {
    const handleUploadClick = (event: CustomEvent) => {
      // Acionar o SecureUploadWidget quando o botão da toolbar for clicado
      if (uploadWidgetRef.current) {
        uploadWidgetRef.current.click();
      }
    };

    document.addEventListener('quill-upload-click', handleUploadClick as EventListener);
    
    // Definir função global para abrir modal de vídeo
    (window as any).openVideoModal = (src: string, filename: string) => {
      setModalVideo({ src, alt: filename });
    };
    
    return () => {
      document.removeEventListener('quill-upload-click', handleUploadClick as EventListener);
      delete (window as any).openVideoModal;
    };
  }, []);

  // Sistema para impedir texto em parágrafos com mídia
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current.getEditor();
    
    const preventTextInMediaParagraphs = () => {
      const editor = quill.container.querySelector('.ql-editor');
      if (!editor) return;

      // Interceptar eventos de teclado
      const handleKeyDown = (e: KeyboardEvent) => {
        const selection = quill.getSelection();
        if (!selection) return;

        const [blot] = quill.getLeaf(selection.index);
        if (!blot || !blot.domNode) return;

        // Verificar se domNode tem o método closest
        if (typeof blot.domNode.closest !== 'function') return;
        
        const paragraph = blot.domNode.closest('p');
        if (!paragraph) return;

        const hasMedia = paragraph.querySelector('img, .ql-video-embed, .video-thumbnail-container');
        
        if (hasMedia && e.key.length === 1) {
          // Impedir digitação de caracteres
          e.preventDefault();
          
          // Criar ou encontrar parágrafo vazio após a mídia
          let nextP = paragraph.nextElementSibling as HTMLElement;
          
          if (!nextP || nextP.tagName !== 'P') {
            // Inserir novo parágrafo via Quill para manter consistência
            const paragraphIndex = quill.getIndex(blot);
            const paragraphLength = quill.getLength(paragraph);
            quill.insertText(paragraphIndex + paragraphLength, '\n');
            nextP = paragraph.nextElementSibling as HTMLElement;
          }
          
          // Mover cursor e inserir o caractere no novo parágrafo
          if (nextP) {
            const nextIndex = quill.getIndex(quill.getLeaf(quill.getLength() - 1)[0]);
            quill.setSelection(nextIndex);
            quill.insertText(nextIndex, e.key);
          }
        }
      };

      // Interceptar tentativas de colar
      const handlePaste = (e: ClipboardEvent) => {
        const selection = quill.getSelection();
        if (!selection) return;

        const [blot] = quill.getLeaf(selection.index);
        if (!blot || !blot.domNode) return;

        const paragraph = blot.domNode.closest('p');
        if (!paragraph) return;

        const hasMedia = paragraph.querySelector('img, .ql-video-embed, .video-thumbnail-container');
        
        if (hasMedia) {
          e.preventDefault();
          
          const clipboardData = e.clipboardData?.getData('text/plain') || '';
          if (clipboardData) {
            // Criar novo parágrafo e colar lá
            let nextP = paragraph.nextElementSibling as HTMLElement;
            
            if (!nextP || nextP.tagName !== 'P') {
              const paragraphIndex = quill.getIndex(blot);
              const paragraphLength = quill.getLength(paragraph);
              quill.insertText(paragraphIndex + paragraphLength, '\n');
              nextP = paragraph.nextElementSibling as HTMLElement;
            }
            
            if (nextP) {
              const nextIndex = quill.getIndex(quill.getLeaf(quill.getLength() - 1)[0]);
              quill.setSelection(nextIndex);
              quill.insertText(nextIndex, clipboardData);
            }
          }
        }
      };

      editor.addEventListener('keydown', handleKeyDown);
      editor.addEventListener('paste', handlePaste);
      
      return () => {
        editor.removeEventListener('keydown', handleKeyDown);
        editor.removeEventListener('paste', handlePaste);
      };
    };

    const cleanup = preventTextInMediaParagraphs();
    
    return cleanup;
  }, []);

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
          {/* SecureUploadWidget invisível, acionado pela toolbar */}
          <div className="hidden">
            <SecureUploadWidget
              ref={uploadWidgetRef}
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
                  
                  // Verificar se há texto na linha atual antes de inserir mídia
                  const currentLine = quill.getLine(index);
                  const lineText = currentLine && currentLine[0] ? currentLine[0].domNode.textContent : '';
                  const hasTextInLine = lineText && lineText.trim().length > 0;
                  
                  let insertIndex = index;
                  
                  // Se há texto na linha atual, inserir quebra de linha antes da mídia
                  if (hasTextInLine) {
                    quill.insertText(index, '\n');
                    insertIndex = index + 1;
                  }
                  
                  if (fileInfo.isImage) {
                    quill.insertEmbed(insertIndex, 'image', fileInfo.url);
                    // Verificar se já existe quebra de linha após a posição atual
                    const nextChar = quill.getText(insertIndex + 1, 1);
                    if (nextChar !== '\n') {
                      quill.insertText(insertIndex + 1, '\n');
                    }
                    // Posicionar cursor após o embed e quebra de linha (padrão oficial Quill)
                    quill.setSelection(insertIndex + 2, 0);
                  } else if (isVideo) {
                    // Para vídeos, inserir usando o blot customizado
                    const videoId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    quill.insertEmbed(insertIndex, 'video', {
                      id: videoId,
                      url: fileInfo.url,
                      filename: fileInfo.originalName
                    });
                    // Verificar se já existe quebra de linha após a posição atual
                    const nextChar = quill.getText(insertIndex + 1, 1);
                    if (nextChar !== '\n') {
                      quill.insertText(insertIndex + 1, '\n');
                    }
                    // Posicionar cursor após o embed e quebra de linha (padrão oficial Quill)
                    quill.setSelection(insertIndex + 2, 0);
                  } else {
                    quill.insertText(insertIndex, `📎 `);
                    quill.insertText(insertIndex + 2, fileInfo.originalName, 'link', fileInfo.url);
                    quill.insertText(insertIndex + 2 + fileInfo.originalName.length, `\n`);
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
      
      {/* Modal de vídeo */}
      <ImageModal
        isOpen={!!modalVideo}
        onClose={() => setModalVideo(null)}
        src={modalVideo?.src || ""}
        alt={modalVideo?.alt || ""}
        isVideo={true}
      />
    </div>
  );
}