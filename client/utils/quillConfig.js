import ReactQuill from 'react-quill';
import VideoBlot from './videoBlot.js';

// Registrar o blot customizado de vídeo
const Quill = ReactQuill.Quill;
Quill.register(VideoBlot);

export const modules = {
  toolbar: [
    [{ size: [false, 'large'] }],
    ['bold', 'italic', { color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }, { align: [] }],
    ['link', 'image']
  ],
};

export const formats = [
  'size', 'bold', 'italic',
  'color', 'background', 'list', 'bullet', 'align',
  'link', 'image',
  'video'
];