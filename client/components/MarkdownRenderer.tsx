import { useState, useEffect } from "react";
import ImageModal from "@/components/ImageModal";
import { cleanContentForDisplay } from "@/utils/contentCleaner";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
    isVideo: boolean;
  } | null>(null);

  // Simple function to handle video clicks
  const handleVideoClick = (src: string, name: string) => {
    console.log("🎬 Video clicked:", src);
    setModalImage({ src, alt: name, isVideo: true });
  };

  // Simple function to handle image clicks
  const handleImageClick = (src: string, alt: string) => {
    console.log("🖼️ Image clicked:", src);
    setModalImage({ src, alt, isVideo: false });
  };

  // Criar thumbnail de vídeo com DOM
  const createVideoThumbnail = (id: string, url: string, filename: string) => {
    const videoId = `video_${id}`;
    const decodedUrl = decodeURIComponent(url);
    const decodedFilename = decodeURIComponent(filename);
    
    // Registrar handler globalmente
    setTimeout(() => {
      const element = document.getElementById(videoId);
      if (element) {
        element.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleVideoClick(decodedUrl, decodedFilename);
        };
        
        // Adicionar eventos de hover
        element.addEventListener('mouseenter', () => {
          element.style.transform = 'scale(1.05)';
          element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          const overlay = element.querySelector('.video-overlay') as HTMLElement;
          if (overlay) overlay.style.background = 'rgba(0,0,0,0.5)';
          const playBtn = element.querySelector('.play-button') as HTMLElement;
          if (playBtn) playBtn.style.transform = 'scale(1.1)';
        });
        
        element.addEventListener('mouseleave', () => {
          element.style.transform = 'scale(1)';
          element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          const overlay = element.querySelector('.video-overlay') as HTMLElement;
          if (overlay) overlay.style.background = 'rgba(0,0,0,0.3)';
          const playBtn = element.querySelector('.play-button') as HTMLElement;
          if (playBtn) playBtn.style.transform = 'scale(1)';
        });
      }
    }, 0);

    return `
      <div id="${videoId}" class="video-thumbnail-container" style="
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
      ">
        <video style="
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        " preload="metadata" muted>
          <source src="${decodedUrl}#t=1" type="video/mp4">
        </video>
        <div class="video-overlay" style="
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
        ">
          <div class="play-button" style="
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" style="margin-left: 2px;">
              <path d="M8 5v14l11-7z" fill="#000"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  };

  // Process content and add click handlers
  const processContent = () => {
    // First clean any edit-mode attributes from content
    let processedContent = cleanContentForDisplay(content);

    // Preserve line breaks: convert <div><br></div> to proper line breaks
    processedContent = processedContent.replace(/<div><br><\/div>/g, "<br>");
    processedContent = processedContent.replace(/<div><br\/><\/div>/g, "<br>");

    // Convert empty divs to line breaks
    processedContent = processedContent.replace(/<div>\s*<\/div>/g, "<br>");

    // Ensure <br> tags are properly preserved
    processedContent = processedContent.replace(/<br><br>/g, "<br><br>");

    // Replace image patterns with clickable images
    processedContent = processedContent.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      (match, alt, src) => {
        const imageId = `img_${Math.random().toString(36).substr(2, 9)}`;
        // Store handler in a global registry
        setTimeout(() => {
          const element = document.getElementById(imageId);
          if (element) {
            element.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleImageClick(src, alt);
            };
          }
        }, 0);

        return `<img id="${imageId}" src="${src}" alt="${alt}" style="max-width: 120px; width: 120px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0 8px 8px 0; display: inline-block; vertical-align: top; cursor: pointer;" />`;
      },
    );

    // Replace video patterns with clickable video previews (old format)
    processedContent = processedContent.replace(
      /\[Vídeo: (.*?)\]\((.*?)\)/g,
      (match, name, src) => {
        const videoId = Math.random().toString(36).substr(2, 9);
        return createVideoThumbnail(videoId, src, name);
      },
    );

    // Replace new video placeholder format: [VIDEO:id:url:filename]
    processedContent = processedContent.replace(
      /\[VIDEO:([^:]+):([^:]+):([^\]]+)\]/g,
      (match, id, url, filename) => {
        return createVideoThumbnail(id, url, filename);
      },
    );

    return processedContent;
  };

  const closeModal = () => {
    console.log("❌ Closing modal");
    setModalImage(null);
  };

  // Setup global function for image modal
  useEffect(() => {
    (window as any).openImageModal = (
      src: string,
      alt: string,
      isVideo: boolean,
    ) => {
      setModalImage({ src, alt, isVideo });
    };

    // Setup global function for video modal
    (window as any).openVideoModal = (src: string, alt: string) => {
      setModalImage({ src, alt, isVideo: true });
    };

    return () => {
      delete (window as any).openImageModal;
      delete (window as any).openVideoModal;
    };
  }, []);

  return (
    <>
      <div
        className="max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processContent() }}
        style={{
          wordBreak: "break-word",
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap",
          lineHeight: "1.6",
        }}
      />

      <ImageModal
        isOpen={!!modalImage}
        onClose={closeModal}
        src={modalImage?.src || ""}
        alt={modalImage?.alt || ""}
        isVideo={modalImage?.isVideo || false}
      />
    </>
  );
}