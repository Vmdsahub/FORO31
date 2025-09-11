import { Quill } from 'react-quill';

const Embed = Quill.import('blots/embed');

class VideoBlot extends Embed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    node.setAttribute('data-video-id', id);
    node.setAttribute('data-video-url', url);
    node.setAttribute('data-video-filename', filename);
    
    // Aplicar estilos diretamente no node (sem container wrapper)
    node.className = 'video-thumbnail-container';
    node.style.cssText = `
      position: relative;
      display: inline-block;
      vertical-align: top;
      width: 200px;
      height: 150px;
      margin: 4px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      background: #000;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      line-height: 0;
    `;
    
    // Criar elemento de vídeo oculto para gerar thumbnail
    const video = document.createElement('video');
    video.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    `;
    video.setAttribute('preload', 'metadata');
    video.setAttribute('muted', 'true');
    video.src = url;
    
    // Criar canvas oculto para capturar frame
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      opacity: 0;
      pointer-events: none;
    `;
    
    // Detectar orientação do vídeo e gerar thumbnail
    video.addEventListener('loadedmetadata', () => {
      const aspectRatio = video.videoWidth / video.videoHeight;
      const isVertical = aspectRatio < 1;
      
      console.log('VideoBlot - Video orientation:', { aspectRatio, isVertical, videoWidth: video.videoWidth, videoHeight: video.videoHeight });
      
      // Altura fixa de 150px para todos os tipos de vídeo
      const fixedHeight = 150;
      let width;
      
      if (isVertical) {
        // Vídeo vertical: calcular largura baseada na altura fixa
        width = Math.round(fixedHeight * aspectRatio);
      } else {
        // Vídeo horizontal: calcular largura baseada na altura fixa
        width = Math.round(fixedHeight * aspectRatio);
      }
      
      node.style.width = width + 'px';
      node.style.height = fixedHeight + 'px';
      
      // Configurar canvas com as dimensões do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Gerar frame aleatório
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        const minTime = video.duration * 0.1;
        const maxTime = video.duration * 0.9;
        const randomTime = Math.random() * (maxTime - minTime) + minTime;
        video.currentTime = randomTime;
      } else {
        video.currentTime = 1;
      }
    });
    
    // Capturar frame quando o vídeo for posicionado no tempo correto
    video.addEventListener('seeked', () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Desenhar frame do vídeo no canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Converter canvas para data URL e definir como background
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      node.style.backgroundImage = `url(${dataUrl})`;
      
      console.log('VideoBlot - Thumbnail gerado com sucesso');
    });
    
    // Criar overlay com botão play
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.3);
      transition: background 0.2s ease;
    `;
    
    // Criar botão play
    const playButton = document.createElement('div');
    playButton.style.cssText = `
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    
    // Criar ícone play SVG
    const playIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    playIcon.setAttribute('width', '20');
    playIcon.setAttribute('height', '20');
    playIcon.setAttribute('viewBox', '0 0 24 24');
    playIcon.style.marginLeft = '2px';
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M8 5v14l11-7z');
    path.setAttribute('fill', '#000');
    
    playIcon.appendChild(path);
    playButton.appendChild(playIcon);
    overlay.appendChild(playButton);
    
    // Montar estrutura diretamente no node
    document.body.appendChild(video); // Adicionar vídeo oculto ao body
    document.body.appendChild(canvas); // Adicionar canvas oculto ao body
    node.appendChild(overlay);
    
    // Adicionar quebra de linha após o vídeo
    const lineBreak = document.createElement('br');
    lineBreak.className = 'video-line-break';
    lineBreak.style.display = 'block';
    lineBreak.style.width = '100%';
    lineBreak.style.height = '1px';
    lineBreak.style.clear = 'both';
    node.appendChild(lineBreak);
    
    // Adicionar eventos de hover
    node.addEventListener('mouseenter', () => {
      node.style.transform = 'scale(1.05)';
      node.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      overlay.style.background = 'rgba(0,0,0,0.5)';
      playButton.style.transform = 'scale(1.1)';
    });
    
    node.addEventListener('mouseleave', () => {
      node.style.transform = 'scale(1)';
      node.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      overlay.style.background = 'rgba(0,0,0,0.3)';
      playButton.style.transform = 'scale(1)';
    });
    
    // Adicionar evento de clique
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
VideoBlot.tagName = 'span';
VideoBlot.className = 'ql-video-embed';

export default VideoBlot;