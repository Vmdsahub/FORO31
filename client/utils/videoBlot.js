import { Quill } from 'react-quill';

const Embed = Quill.import('blots/embed');

class VideoBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    // Configurar atributos
    node.setAttribute('data-video-id', id);
    node.setAttribute('data-video-url', url);
    node.setAttribute('data-video-filename', filename);
    node.setAttribute('src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMDAwIiByeD0iOCIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI3NSIgcj0iMjQiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC45KSIvPgo8cGF0aCBkPSJNOTIgNjVMMTE2IDc1TDkyIDg1VjY1WiIgZmlsbD0iIzAwMCIvPgo8L3N2Zz4K');
    node.setAttribute('alt', `Vídeo: ${filename}`);
    
    // Aplicar estilos inline para comportamento de imagem
    node.style.cssText = `
      width: 200px;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      margin: 4px;
      display: inline-block;
      vertical-align: top;
      background: #000;
    `;
    
    // Detectar orientação do vídeo e gerar thumbnail
    const video = document.createElement('video');
    video.style.cssText = 'position: absolute; top: -9999px; left: -9999px; opacity: 0;';
    video.setAttribute('preload', 'metadata');
    video.setAttribute('muted', 'true');
    video.src = url;
    
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position: absolute; top: -9999px; left: -9999px; opacity: 0;';
    
    video.addEventListener('loadedmetadata', () => {
      const aspectRatio = video.videoWidth / video.videoHeight;
      const isVertical = aspectRatio < 1;
      
      // Altura fixa de 150px, largura proporcional
      const fixedHeight = 150;
      const calculatedWidth = Math.round(fixedHeight * aspectRatio);
      
      // Aplicar dimensões calculadas
      node.style.width = calculatedWidth + 'px';
      node.style.height = fixedHeight + 'px';
      
      // Configurar canvas com dimensões do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Gerar frame aleatório (entre 10% e 90% da duração)
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        const minTime = video.duration * 0.1;
        const maxTime = video.duration * 0.9;
        const randomTime = Math.random() * (maxTime - minTime) + minTime;
        video.currentTime = randomTime;
      } else {
        video.currentTime = 1;
      }
      
      console.log(`Vídeo ${isVertical ? 'vertical' : 'horizontal'}: ${calculatedWidth}x${fixedHeight}`);
    });
    
    video.addEventListener('seeked', () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Desenhar frame do vídeo no canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Converter canvas para data URL e definir como src
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      node.setAttribute('src', dataUrl);
      
      console.log('Thumbnail gerada com sucesso');
      
      // Limpar elementos temporários
      document.body.removeChild(video);
      document.body.removeChild(canvas);
    });
    
    // Adicionar elementos temporários ao DOM
    document.body.appendChild(video);
    document.body.appendChild(canvas);
    
    // Evento de clique para abrir modal
    node.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Abrir modal de vídeo
      if (window.openVideoModal) {
        window.openVideoModal(url, filename);
      } else {
        // Fallback: abrir em nova aba
        window.open(url, '_blank');
      }
    });
    
    // Efeito hover
    node.addEventListener('mouseenter', () => {
      node.style.transform = 'scale(1.05)';
      node.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    });
    
    node.addEventListener('mouseleave', () => {
      node.style.transform = 'scale(1)';
      node.style.boxShadow = 'none';
    });
    
    return node;
  }

  static value(node) {
    return {
      id: node.getAttribute('data-video-id'),
      url: node.getAttribute('data-video-url'),
      filename: node.getAttribute('data-video-filename')
    };
  }

  static formats(node) {
    return {
      id: node.getAttribute('data-video-id'),
      url: node.getAttribute('data-video-url'),
      filename: node.getAttribute('data-video-filename')
    };
  }
}

VideoBlot.blotName = 'video';
VideoBlot.tagName = 'img';
VideoBlot.className = 'ql-video-embed';

Quill.register(VideoBlot);

export default VideoBlot;