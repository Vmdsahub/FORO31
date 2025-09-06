import { Quill } from 'react-quill';

const BlockEmbed = Quill.import('blots/block/embed');

class VideoBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    const { id, url, filename } = value;
    
    node.setAttribute('data-video-id', id);
    node.setAttribute('data-video-url', url);
    node.setAttribute('data-video-filename', filename);
    
    // Criar container principal
    const container = document.createElement('div');
    container.className = 'video-thumbnail-container';
    container.style.cssText = `
      position: relative;
      display: inline-block;
      width: 200px;
      height: 150px;
      margin: 8px 4px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      background: #000;
    `;
    
    // Criar elemento de vídeo para thumbnail
    const video = document.createElement('video');
    video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    `;
    video.setAttribute('preload', 'metadata');
    video.setAttribute('muted', 'true');
    video.src = `${url}#t=1`;
    
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
    
    // Montar estrutura
    container.appendChild(video);
    container.appendChild(overlay);
    node.appendChild(container);
    
    // Adicionar eventos de hover
    container.addEventListener('mouseenter', () => {
      container.style.transform = 'scale(1.05)';
      container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      overlay.style.background = 'rgba(0,0,0,0.5)';
      playButton.style.transform = 'scale(1.1)';
    });
    
    container.addEventListener('mouseleave', () => {
      container.style.transform = 'scale(1)';
      container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      overlay.style.background = 'rgba(0,0,0,0.3)';
      playButton.style.transform = 'scale(1)';
    });
    
    // Adicionar evento de clique
    container.addEventListener('click', (e) => {
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
VideoBlot.tagName = 'div';
VideoBlot.className = 'ql-video-embed';

export default VideoBlot;