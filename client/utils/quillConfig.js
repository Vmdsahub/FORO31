import ReactQuill from 'react-quill';
import VideoBlot from './videoBlot.js';

// Registrar o blot customizado de vídeo
const Quill = ReactQuill.Quill;
Quill.register(VideoBlot);

// Handler customizado para o botão de upload
function insertUpload() {
  // Este handler será chamado quando o botão customizado for clicado
  // A lógica real será implementada no componente TopicCreate
  const event = new CustomEvent('quill-upload-click', {
    detail: { quill: this.quill }
  });
  document.dispatchEvent(event);
}

export const modules = {
  toolbar: {
    container: [
      [{ size: [false, 'large'] }],
      ['bold', 'italic', { color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }, { align: [] }],
      ['link', 'upload']
    ],
    handlers: {
      upload: insertUpload
    }
  },
};

export const formats = [
  'size', 'bold', 'italic',
  'color', 'background', 'list', 'bullet', 'align',
  'link', 'image',
  'video'
];