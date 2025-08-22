import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ImageModal from "@/components/ImageModal";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SecureUploadWidget, {
  UploadedFileInfo,
  isImageFile,
  isVideoFile,
  isAudioFile,
  isGifFile,
} from "@/components/SecureUploadWidget";

interface EnhancedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isEditMode?: boolean; // New prop to control edit mode
}

export default function EnhancedRichTextEditor({
  value,
  onChange,
  placeholder,
  isEditMode = true, // Default to edit mode (creation/editing)
}: EnhancedRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
    isVideo: boolean;
  } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const savedSelectionRef = useRef<Range | null>(null);
  const colorPickerTriggerRef = useRef<HTMLButtonElement>(null);
  const [fontSize, setFontSize] = useState("16");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Função para detectar estado atual de formatação - REMOVIDA
  // Os botões agora são controlados manualmente pelo usuário

  // Tamanhos de fonte pré-determinados
  const fontSizes = [
    { value: "10", label: "10px" },
    { value: "12", label: "12px" },
    { value: "14", label: "14px" },
    { value: "16", label: "16px" },
    { value: "18", label: "18px" },
    { value: "20", label: "20px" },
  ];

  // Função para salvar seleção atual
  const saveCurrentSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  // Função para restaurar seleção salva
  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }
  };

  // Initialize secure upload system
  const [secureUploadStats, setSecureUploadStats] = useState<{
    safeFiles: number;
    quarantined: { total: number; recent: number };
  } | null>(null);

  useEffect(() => {
    // Load upload statistics
    fetch("/api/upload-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSecureUploadStats(data.stats);
        }
      })
      .catch((err) => console.warn("Could not load upload stats:", err));
  }, []);

  // Function to add delete buttons to existing media elements that don't have them
  const addDeleteButtonsToExistingMedia = () => {
    if (!editorRef.current || !isEditMode) return;

    // Find images without delete buttons
    const images = editorRef.current.querySelectorAll(
      "img:not([data-has-delete])",
    );
    images.forEach((img) => {
      const imgElement = img as HTMLImageElement;

      // Skip if already has a delete button wrapper
      if (imgElement.parentElement?.style.position === "relative") return;

      // Create wrapper and delete button
      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "display: inline-block; position: relative; margin: 0 8px 8px 0;";

      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "🗑️";
      deleteButton.title = "Excluir imagem";
      deleteButton.style.cssText =
        "position: absolute; top: -8px; right: -8px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; pointer-events: auto;";

      deleteButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Excluir esta imagem?")) {
          const container = wrapper.closest(".image-container");
          wrapper.remove();

          // Remove o container se ficar vazio
          if (container && container.children.length === 0) {
            container.remove();
          }

          handleInput();
        }
      };

      // Replace img with wrapper
      imgElement.parentNode?.insertBefore(wrapper, imgElement);
      wrapper.appendChild(imgElement);
      wrapper.appendChild(deleteButton);

      // Mark as processed
      imgElement.setAttribute("data-has-delete", "true");
    });

    // Find videos without delete buttons
    const videos = editorRef.current.querySelectorAll(
      ".video-preview:not([data-has-delete])",
    );
    videos.forEach((videoElement) => {
      // Skip if already has delete button
      if (videoElement.querySelector('button[title*="Excluir"]')) return;

      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "🗑️";
      deleteButton.title = "Excluir vídeo";
      deleteButton.style.cssText =
        "position: absolute; top: -8px; right: -8px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; pointer-events: auto;";

      deleteButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Excluir este vídeo?")) {
          const container = videoElement.closest(".image-container");
          videoElement.remove();

          // Remove o container se ficar vazio
          if (container && container.children.length === 0) {
            container.remove();
          }

          handleInput();
        }
      };

      videoElement.appendChild(deleteButton);
      videoElement.setAttribute("data-has-delete", "true");
    });
  };

  // Sync editor content with value and add delete buttons to existing media
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;

      // Add delete buttons to any existing media after content loads
      setTimeout(() => {
        addDeleteButtonsToExistingMedia();
      }, 100);
    }
  }, [value, isEditMode]);

  // Configure global functions - conditional based on edit mode
  useEffect(() => {
    // Only setup modal and download functions in edit mode
    if (isEditMode) {
      (window as any).downloadFile = (url: string, filename: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    }

    return () => {
      // Clean up only the functions we created
      if (isEditMode) {
        delete (window as any).downloadFile;
      }
    };
  }, [isEditMode]);

  // Manage placeholder manually
  // Limpar conteúdo inicial
  useEffect(() => {
    if (value && editorRef.current) {
      const cleaned = cleanHTML(value);
      if (cleaned !== value) {
        onChange(cleaned);
      }
    }
  }, []); // Executar apenas uma vez no mount

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const updatePlaceholder = () => {
      const isEmpty =
        editor.innerHTML.trim() === "" || editor.innerHTML === "<br>";
      if (isEmpty && placeholder) {
        editor.setAttribute("data-empty", "true");
      } else {
        editor.removeAttribute("data-empty");
      }
    };

    const handleBlur = () => {
      updatePlaceholder();
      // Limpar HTML ao perder foco
      setTimeout(() => {
        if (editorRef.current) {
          const cleaned = cleanHTML(editorRef.current.innerHTML);
          if (cleaned !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = cleaned;
            onChange(cleaned);
          }
        }
      }, 100);
    };

    updatePlaceholder();
    editor.addEventListener("input", updatePlaceholder);
    editor.addEventListener("focus", updatePlaceholder);
    editor.addEventListener("blur", handleBlur);

    return () => {
      editor.removeEventListener("input", updatePlaceholder);
      editor.removeEventListener("focus", updatePlaceholder);
      editor.removeEventListener("blur", handleBlur);
    };
  }, [placeholder]);

  // Função para limpar e otimizar HTML
  const cleanHTML = (html: string): string => {
    // Criar um elemento temporário para manipular o HTML
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Remover elementos font vazios
    const fontElements = temp.querySelectorAll("font");
    fontElements.forEach((font) => {
      if (!font.textContent?.trim()) {
        font.remove();
      }
    });

    // Remover spans vazios
    const spanElements = temp.querySelectorAll("span");
    spanElements.forEach((span) => {
      if (!span.textContent?.trim() && !span.querySelector("img, video")) {
        span.remove();
      }
    });

    // Remover atributos desnecessários
    const allElements = temp.querySelectorAll("*");
    allElements.forEach((element) => {
      // Remover atributos vazios ou desnecessários
      if (
        element.hasAttribute("style") &&
        !element.getAttribute("style")?.trim()
      ) {
        element.removeAttribute("style");
      }
    });

    return temp.innerHTML;
  };

  const handleInput = () => {
    if (editorRef.current) {
      const rawContent = editorRef.current.innerHTML;
      const cleanedContent = cleanHTML(rawContent);
      onChange(cleanedContent);
      // Atualizar estado dos botões após mudança no conteúdo
      setTimeout(() => updateFormattingState(), 10);
    }
  };

  // Aplicar cor atual quando necessário
  const applyCurrentColor = () => {
    if (currentColor && currentColor !== "#000000") {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, currentColor);
    }
  };

  // Aplicar tamanho da fonte atual quando necessário
  const applyCurrentFontSize = () => {
    if (fontSize && fontSize !== "16") {
      document.execCommand("styleWithCSS", false, "true");

      // Converter tamanho para um valor válido de execCommand (1-7)
      let sizeValue = "3"; // padrão médio

      switch (fontSize) {
        case "10":
          sizeValue = "1";
          break;
        case "12":
          sizeValue = "2";
          break;
        case "14":
          sizeValue = "3";
          break;
        case "16":
          sizeValue = "4";
          break;
        case "18":
          sizeValue = "5";
          break;
        case "20":
          sizeValue = "6";
          break;
      }

      document.execCommand("fontSize", false, sizeValue);
    }
  };

  const handleEditorFocus = () => {
    // Add delete buttons when user focuses on editor
    setTimeout(() => {
      addDeleteButtonsToExistingMedia();
      // Aplicar cor e tamanho atuais quando focar no editor
      applyCurrentColor();
      applyCurrentFontSize();
    }, 50);
  };

  // Handler para quando usuário começa a digitar
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    // Para teclas que inserem texto, garantir que cor e tamanho estão aplicados
    if (e.key.length === 1) {
      setTimeout(() => {
        applyCurrentColor();
        applyCurrentFontSize();
      }, 0);
    }
  };

  const handleEditorClick = () => {
    // Salvar seleção e aplicar cor e tamanho atuais
    setTimeout(() => {
      saveCurrentSelection();
      applyCurrentColor();
      applyCurrentFontSize();
    }, 10);
  };

  const handleEditorKeyUp = (e: React.KeyboardEvent) => {
    // Salvar seleção após navegação com teclado
    setTimeout(() => {
      saveCurrentSelection();
      // Se foi uma tecla de caractere, aplicar cor e tamanho
      if (e.key.length === 1) {
        applyCurrentColor();
        applyCurrentFontSize();
      }
    }, 10);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const execCommandWithSelection = (command: string, value?: string) => {
    // Salvar seleção atual
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = range.cloneRange();
    }

    // Executar comando
    document.execCommand(command, false, value);

    // Restaurar seleção
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }

    handleInput();
  };

  const handleBold = () => {
    document.execCommand("bold", false);
    handleInput();
    // Atualizar estado após comando
    setTimeout(() => updateFormattingState(), 10);
  };

  const handleItalic = () => {
    document.execCommand("italic", false);
    handleInput();
    // Atualizar estado após comando
    setTimeout(() => updateFormattingState(), 10);
  };

  const handleUnderline = () => {
    document.execCommand("underline", false);
    handleInput();
    // Atualizar estado após comando
    setTimeout(() => updateFormattingState(), 10);
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);

    // Focus no editor
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const resetColor = () => {
    setCurrentColor("#000000");
    if (savedSelectionRef.current) {
      restoreSelection();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, "#000000");
      saveCurrentSelection();
      handleInput();
    }
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        applyCurrentColor();
      }
    }, 50);
  };

  const handleLink = () => {
    const url = prompt("Digite a URL:");
    if (url) {
      execCommandWithSelection("createLink", url);
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);

    // Aplicar cor imediatamente se há seleção salva
    if (savedSelectionRef.current) {
      restoreSelection();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, color);
      saveCurrentSelection();
      handleInput();
    }

    // Garantir que a próxima digitação use esta cor
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        applyCurrentColor();
      }
    }, 50);
  };

  const closeColorPicker = () => {
    setShowColorPicker(false);
    // Restaurar foco no editor
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 50);
  };

  const handleSecureUploadSuccess = (fileInfo: UploadedFileInfo) => {
    // Automatic media insertion based on file type
    if (
      isImageFile(fileInfo.originalName) ||
      isGifFile(fileInfo.originalName)
    ) {
      insertImageHtml(fileInfo.url, fileInfo.originalName);
    } else if (isVideoFile(fileInfo.originalName)) {
      insertVideoHtml(fileInfo.url, fileInfo.originalName);
    } else if (isAudioFile(fileInfo.originalName)) {
      insertAudioHtml(fileInfo.url, fileInfo.originalName, fileInfo.size);
    } else {
      insertFileLink(fileInfo.url, fileInfo.originalName, fileInfo.size);
    }

    toast.success(
      `🔒 Arquivo verificado e carregado: ${fileInfo.originalName}`,
    );

    // Update stats
    if (secureUploadStats) {
      setSecureUploadStats({
        ...secureUploadStats,
        safeFiles: secureUploadStats.safeFiles + 1,
      });
    }
  };

  const handleSecureUploadError = (error: string) => {
    console.error("Secure upload error:", error);
    toast.error("❌ Falha na verificação de segurança. Tente outro arquivo.");
  };

  const insertImageHtml = (src: string, alt: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Clean up empty divs at the end first
    while (
      editor.lastElementChild &&
      editor.lastElementChild.tagName === "DIV" &&
      editor.lastElementChild.innerHTML === "<br>"
    ) {
      editor.removeChild(editor.lastElementChild);
    }

    // Find the last image container in the editor
    const imageContainers = editor.querySelectorAll(".image-container");
    const lastImageContainer = imageContainers[
      imageContainers.length - 1
    ] as HTMLElement;

    // Check if we should group images - look for last image container and check if there's only empty content after it
    let shouldGroupImages = false;

    if (lastImageContainer) {
      // Find position of last image container
      const children = Array.from(editor.children);
      const lastImageIndex = children.indexOf(lastImageContainer);

      if (lastImageIndex !== -1) {
        // Check all elements after the last image container
        let hasContentAfterImage = false;
        for (let i = lastImageIndex + 1; i < children.length; i++) {
          const child = children[i];
          // If it's a div with just <br>, it's empty
          if (child.tagName === "DIV" && child.innerHTML === "<br>") {
            continue;
          }
          // If it has any text content, there's content after the image
          if (child.textContent && child.textContent.trim()) {
            hasContentAfterImage = true;
            break;
          }
        }

        shouldGroupImages = !hasContentAfterImage;
      }
    }

    if (shouldGroupImages && lastImageContainer) {
      // Calculate how many images are already in the container
      const existingImages = lastImageContainer.querySelectorAll("img");
      const containerWidth = 600; // increased container width
      const imageWidth = 120 + 8; // reduced image width + margin
      const maxImagesPerRow = Math.floor(containerWidth / imageWidth);

      if (existingImages.length < maxImagesPerRow) {
        // Add image to existing container (side by side)
        const imageElement = document.createElement("img");
        imageElement.src = src;
        imageElement.alt = alt;
        imageElement.style.cssText =
          "max-width: 120px; width: 120px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0 8px 8px 0; display: inline-block; vertical-align: top;";

        // Adicionar lixeira para excluir imagem apenas em modo de edição
        if (isEditMode) {
          const imageWrapper = document.createElement("div");
          imageWrapper.style.cssText =
            "display: inline-block; position: relative; margin: 0 8px 8px 0;";

          const deleteButton = document.createElement("button");
          deleteButton.innerHTML = "🗑️";
          deleteButton.title = "Excluir imagem";
          deleteButton.style.cssText =
            "position: absolute; top: -8px; right: -8px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; pointer-events: auto;";

          deleteButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm("Excluir esta imagem?")) {
              const container = imageWrapper.closest(".image-container");
              imageWrapper.remove();

              // Remove o container se ficar vazio
              if (container && container.children.length === 0) {
                container.remove();
              }

              handleInput();
            }
          };

          imageWrapper.appendChild(imageElement);
          imageWrapper.appendChild(deleteButton);
          lastImageContainer.appendChild(imageWrapper);
        } else {
          lastImageContainer.appendChild(imageElement);
        }

        // Position cursor after the container but don't create extra div
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.setStartAfter(lastImageContainer);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        handleInput();
        return;
      }
    }

    // Create new image container
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editor.focus();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    // Clean up any trailing BR tags before inserting
    const range = selection!.getRangeAt(0);
    let insertPosition = range.startContainer;

    // If we're in a text node, move to parent
    if (insertPosition.nodeType === Node.TEXT_NODE) {
      insertPosition = insertPosition.parentNode!;
    }

    // Remove any empty BR tags at the end
    while (
      editor.lastChild &&
      editor.lastChild.nodeType === Node.ELEMENT_NODE &&
      (editor.lastChild as HTMLElement).tagName === "BR"
    ) {
      editor.removeChild(editor.lastChild);
    }

    // Create the image container
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container";
    imageContainer.contentEditable = "false";
    imageContainer.style.cssText =
      "margin: 8px 0; text-align: center; user-select: none; line-height: 0;";

    const imageElement = document.createElement("img");
    imageElement.src = src;
    imageElement.alt = alt;
    imageElement.style.cssText =
      "max-width: 120px; width: 120px; height: auto; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0 8px 8px 0; display: inline-block; vertical-align: top;";

    // Adicionar lixeira para excluir imagem apenas em modo de edição
    if (isEditMode) {
      const imageWrapper = document.createElement("div");
      imageWrapper.style.cssText =
        "display: inline-block; position: relative; margin: 0 8px 8px 0;";

      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "🗑️";
      deleteButton.title = "Excluir imagem";
      deleteButton.style.cssText =
        "position: absolute; top: -8px; right: -8px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center;";

      deleteButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Excluir esta imagem?")) {
          const container = imageWrapper.closest(".image-container");
          imageWrapper.remove();

          // Remove o container se ficar vazio
          if (container && container.children.length === 0) {
            container.remove();
          }

          handleInput();
        }
      };

      imageWrapper.appendChild(imageElement);
      imageWrapper.appendChild(deleteButton);
      imageContainer.appendChild(imageWrapper);
    } else {
      imageContainer.appendChild(imageElement);
    }

    // Insert the container at the end of the editor
    editor.appendChild(imageContainer);

    // Position cursor after the image container and ensure text input is visible
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection) {
        // Create a div for text input after the image
        const textDiv = document.createElement("div");
        textDiv.innerHTML = "&nbsp;"; // Use non-breaking space instead of <br>
        textDiv.style.minHeight = "1.2em"; // Ensure minimum height for text
        editor.appendChild(textDiv);

        const range = document.createRange();
        range.setStart(textDiv, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        // Focus the text div specifically
        textDiv.focus();
      }

      editor.focus();
      handleInput();
    }, 50); // Increased timeout for better reliability
  };

  const insertVideoHtml = (src: string, name: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Clean up empty divs at the end first
    while (
      editor.lastElementChild &&
      editor.lastElementChild.tagName === "DIV" &&
      editor.lastElementChild.innerHTML === "<br>"
    ) {
      editor.removeChild(editor.lastElementChild);
    }

    // Find the last media container (images or videos) in the editor
    const mediaContainers = editor.querySelectorAll(
      ".image-container, .video-container",
    );
    const lastMediaContainer = mediaContainers[
      mediaContainers.length - 1
    ] as HTMLElement;

    // Check if we should group with existing media
    let shouldGroupMedia = false;

    if (lastMediaContainer) {
      // Find position of last media container
      const children = Array.from(editor.children);
      const lastMediaIndex = children.indexOf(lastMediaContainer);

      if (lastMediaIndex !== -1) {
        // Check all elements after the last media container
        let hasContentAfterMedia = false;
        for (let i = lastMediaIndex + 1; i < children.length; i++) {
          const child = children[i];
          if (child.tagName === "DIV" && child.innerHTML === "<br>") {
            continue;
          }
          if (child.textContent && child.textContent.trim()) {
            hasContentAfterMedia = true;
            break;
          }
        }

        shouldGroupMedia = !hasContentAfterMedia;
      }
    }

    if (shouldGroupMedia && lastMediaContainer) {
      // Calculate how many media items are already in the container
      const existingMedia = lastMediaContainer.querySelectorAll(
        "img, .video-preview",
      );
      const containerWidth = 800;
      const mediaWidth = 240 + 8; // media width + margin (for videos), images are still 120px
      const maxMediaPerRow = Math.floor(containerWidth / mediaWidth);

      if (existingMedia.length < maxMediaPerRow) {
        // Add video preview to existing container (side by side)
        const videoPreview = document.createElement("div");
        videoPreview.className = "video-preview";
        videoPreview.style.cssText =
          "position: relative; max-width: 240px; width: 240px; height: 180px; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0 4px 4px 0; display: inline-block; vertical-align: top; background: #1a1a1a; cursor: pointer; overflow: hidden; line-height: 0;";

        // Create video thumbnail using canvas approach to eliminate black bar
        const videoElement = document.createElement("video");
        videoElement.src = src;
        videoElement.style.cssText =
          "width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 8px;";
        videoElement.muted = true;
        videoElement.preload = "metadata";
        videoElement.setAttribute("playsinline", "true");
        if (isEditMode) {
          videoElement.setAttribute("data-edit-mode", "true");
        }

        // Create pure glassmorphism play button overlay
        const playOverlay = document.createElement("div");
        playOverlay.style.cssText =
          "position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;";
        playOverlay.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));">
            <path d="M8 5v14l11-7z" fill="rgba(255,255,255,0.9)" style="backdrop-filter: blur(10px);"/>
          </svg>
        `;

        // Mark as edit mode to prevent click handlers during editing
        videoPreview.setAttribute("data-edit-mode", isEditMode.toString());

        if (!isEditMode) {
          const clickHandler = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Video clicked:", src, name);
            if (
              typeof window !== "undefined" &&
              (window as any).openImageModal
            ) {
              (window as any).openImageModal(src, name, true);
            }
          };
          videoPreview.addEventListener("click", clickHandler);
          playOverlay.addEventListener("click", clickHandler);
        }

        videoPreview.appendChild(videoElement);
        videoPreview.appendChild(playOverlay);

        // Adicionar lixeira para excluir vídeo apenas em modo de edição
        if (isEditMode) {
          const deleteButton = document.createElement("button");
          deleteButton.innerHTML = "🗑️";
          deleteButton.title = "Excluir vídeo";
          deleteButton.style.cssText =
            "position: absolute; top: -8px; right: -8px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; pointer-events: auto;";

          deleteButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm("Excluir este vídeo?")) {
              const container = videoPreview.closest(".image-container");
              videoPreview.remove();

              // Remove o container se ficar vazio
              if (container && container.children.length === 0) {
                container.remove();
              }

              handleInput();
            }
          };

          videoPreview.appendChild(deleteButton);
        }

        lastMediaContainer.appendChild(videoPreview);

        // Position cursor after the container
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.setStartAfter(lastMediaContainer);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        handleInput();
        return;
      }
    }

    // Create new media container
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editor.focus();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    // Create the media container
    const mediaContainer = document.createElement("div");
    mediaContainer.className = "image-container"; // Use same class for consistent styling
    mediaContainer.contentEditable = "false";
    mediaContainer.style.cssText =
      "margin: 8px 0; text-align: center; user-select: none; line-height: 0;";

    // Create video preview
    const videoPreview = document.createElement("div");
    videoPreview.className = "video-preview";
    videoPreview.style.cssText =
      "position: relative; max-width: 240px; width: 240px; height: 180px; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0 4px 4px 0; display: inline-block; vertical-align: top; background: #1a1a1a; cursor: pointer; overflow: hidden; line-height: 0;";

    // Create video thumbnail using improved approach to eliminate black bar
    const videoElement = document.createElement("video");
    videoElement.src = src;
    videoElement.style.cssText =
      "width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 8px;";
    videoElement.muted = true;
    videoElement.preload = "metadata";
    videoElement.setAttribute("playsinline", "true");
    if (isEditMode) {
      videoElement.setAttribute("data-edit-mode", "true");
    }

    // Create pure glassmorphism play button overlay
    const playOverlay = document.createElement("div");
    playOverlay.style.cssText =
      "position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;";
    playOverlay.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));">
        <path d="M8 5v14l11-7z" fill="rgba(255,255,255,0.9)" style="backdrop-filter: blur(10px);"/>
      </svg>
    `;

    // Mark as edit mode to prevent click handlers during editing
    videoPreview.setAttribute("data-edit-mode", isEditMode.toString());

    // Add click handlers only if not in edit mode
    if (!isEditMode) {
      const clickHandler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Video clicked:", src, name);
        if (typeof window !== "undefined" && (window as any).openImageModal) {
          (window as any).openImageModal(src, name, true);
        }
      };
      videoPreview.addEventListener("click", clickHandler);
      playOverlay.addEventListener("click", clickHandler);
    }

    videoPreview.appendChild(videoElement);
    videoPreview.appendChild(playOverlay);

    // Adicionar lixeira para excluir vídeo apenas em modo de edição
    if (isEditMode) {
      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "🗑️";
      deleteButton.title = "Excluir vídeo";
      deleteButton.style.cssText =
        "position: absolute; top: -8px; right: -8px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; pointer-events: auto;";

      deleteButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Excluir este vídeo?")) {
          const container = videoPreview.closest(".image-container");
          videoPreview.remove();

          // Remove o container se ficar vazio
          if (container && container.children.length === 0) {
            container.remove();
          }

          handleInput();
        }
      };

      videoPreview.appendChild(deleteButton);
    }

    mediaContainer.appendChild(videoPreview);

    // Insert the container at the end of the editor
    editor.appendChild(mediaContainer);

    // No need for global video setup in edit mode

    // Position cursor after the media container and ensure text input is visible
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection) {
        // Create a div for text input after the media
        const textDiv = document.createElement("div");
        textDiv.innerHTML = "&nbsp;"; // Use non-breaking space instead of <br>
        textDiv.style.minHeight = "1.2em"; // Ensure minimum height for text
        textDiv.contentEditable = "true"; // Make sure it's editable
        editor.appendChild(textDiv);

        const range = document.createRange();
        range.setStart(textDiv, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        // Focus the text div specifically
        textDiv.focus();
      }

      editor.focus();
      handleInput();
    }, 50); // Increased timeout for better reliability
  };

  const insertAudioHtml = (src: string, name: string, size?: number) => {
    const sizeText = size ? ` (${formatFileSize(size)})` : "";
    // Reduced width to 65% (260px instead of 400px)
    const audio = `<div contenteditable="false" style="margin: 8px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; max-width: 260px; margin-left: auto; margin-right: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); user-select: none; clear: both;"><audio controls style="width: 100%; height: 32px; margin-bottom: 8px;"><source src="${src}" type="audio/mpeg"><source src="${src}" type="audio/wav"><source src="${src}" type="audio/ogg">Seu navegador não suporta áudio HTML5.</audio><div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 13px; color: #374151; font-weight: 500;">${name}${sizeText}</span><button onclick="window.downloadFile('${src}', '${name}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'" title="Download do áudio">Download</button></div></div>`;

    const editor = editorRef.current;
    if (!editor) return;

    // Insert audio without extra line breaks
    execCommand("insertHTML", audio);

    // Position cursor after audio
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      editor.focus();
      handleInput();
    }, 10);
  };

  const insertFileLink = (url: string, name: string, size?: number) => {
    const sizeText = size ? ` (${formatFileSize(size)})` : "";
    const fileLink = `<div contenteditable="false" style="margin: 8px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); user-select: none; transition: all 0.2s; clear: both;" onmouseover="this.style.backgroundColor='#f9fafb'" onmouseout="this.style.backgroundColor='white'"><div style="display: flex; align-items: center; justify-content: space-between;"><div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 14px; color: #6b7280;">📎</span><span style="font-size: 14px; color: #374151; font-weight: 500;">${name}${sizeText}</span></div><button onclick="window.downloadFile('${url}', '${name}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'" title="Download do arquivo">Download</button></div></div>`;

    const editor = editorRef.current;
    if (!editor) return;

    // Insert file link without extra line breaks
    execCommand("insertHTML", fileLink);

    // Position cursor after file
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      editor.focus();
      handleInput();
    }, 10);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50 flex-wrap">
        <Button
          type="button"
          variant={isBold ? "default" : "outline"}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBold}
          className={`h-8 px-2 hover:bg-gray-100 ${isBold ? "bg-blue-500 text-white hover:bg-blue-600" : ""}`}
          title="Negrito (Ctrl+B)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </Button>

        <Button
          type="button"
          variant={isItalic ? "default" : "outline"}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleItalic}
          className={`h-8 px-2 hover:bg-gray-100 ${isItalic ? "bg-blue-500 text-white hover:bg-blue-600" : ""}`}
          title="Itálico (Ctrl+I)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
          </svg>
        </Button>

        <Button
          type="button"
          variant={isUnderline ? "default" : "outline"}
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleUnderline}
          className={`h-8 px-2 hover:bg-gray-100 ${isUnderline ? "bg-blue-500 text-white hover:bg-blue-600" : ""}`}
          title="Sublinhado"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
          </svg>
        </Button>

        {/* Font Size Dropdown */}
        <Select value={fontSize} onValueChange={handleFontSizeChange}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            {fontSizes.map((size) => (
              <SelectItem
                key={size.value}
                value={size.value}
                className="text-xs"
              >
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          className="h-8 px-2 hover:bg-gray-100"
          title="Link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6v2H5v5h5v2l3-4.5L10 6zM19 15l-3-4.5L19 6v2h5v5h-5v2z" />
          </svg>
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Color Picker */}
        <Popover
          open={showColorPicker}
          onOpenChange={(open) => {
            // Controle manual - só fecha via closeColorPicker()
            if (!open) {
              return; // Bloquear fechamento automático
            }
          }}
          modal={false}
        >
          <PopoverTrigger asChild>
            <Button
              ref={colorPickerTriggerRef}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2 hover:bg-gray-100"
              title="Cor do texto"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                saveCurrentSelection();
                setShowColorPicker(!showColorPicker);
              }}
            >
              <div className="flex items-center gap-1">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 3c-1.1 0-2 .9-2 2v6l-4 4h12l-4-4V5c0-1.1-.9-2-2-2z" />
                </svg>
                <div
                  className="w-3 h-3 rounded border border-gray-300"
                  style={{ backgroundColor: currentColor }}
                />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            side="bottom"
            align="start"
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              closeColorPicker();
            }}
            onPointerDownOutside={(e) => {
              const target = e.target as Element;
              const colorPickerElement = colorPickerRef.current;
              const triggerElement = colorPickerTriggerRef.current;

              // Não fechar se clicou dentro do color picker, trigger, ou elementos react-colorful
              if (
                colorPickerElement?.contains(target) ||
                triggerElement?.contains(target) ||
                target.closest(".react-colorful") ||
                target.closest("[data-radix-popper-content]")
              ) {
                e.preventDefault();
                return;
              }

              // Só fechar se clicou realmente fora
              closeColorPicker();
            }}
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
            onFocusOutside={(e) => {
              e.preventDefault();
            }}
          >
            <div ref={colorPickerRef} className="color-picker-container">
              <HexColorPicker
                color={currentColor}
                onChange={handleColorChange}
              />
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-300 shadow-sm"
                    style={{ backgroundColor: currentColor }}
                  />
                  <input
                    type="text"
                    value={currentColor}
                    onChange={(e) => {
                      handleColorChange(e.target.value);
                    }}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    placeholder="#000000"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={resetColor}
                    className="h-6 px-1 text-xs hover:bg-gray-100"
                    title="Resetar cor padrão"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Secure Upload Widget - único botão de upload */}
        <SecureUploadWidget
          onSuccess={handleSecureUploadSuccess}
          onError={handleSecureUploadError}
          buttonText="🔒 Upload"
          className="h-8"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
            </svg>
          }
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={handleEditorFocus}
        onClick={handleEditorClick}
        onKeyUp={handleEditorKeyUp}
        onKeyDown={handleEditorKeyDown}
        className="w-full p-4 min-h-[200px] focus:outline-none bg-white rich-editor"
        style={{
          lineHeight: "1.4", // Reduzido de 1.7 para 1.4
          fontSize: "16px", // Tamanho base padrão
          wordWrap: "break-word",
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap",
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* Enhanced CSS for better layout and text handling */}
      <style>{`
        /* Color picker styles */
        .color-picker-container {
          padding: 8px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: fit-content;
          max-width: 200px;
        }

        .react-colorful {
          width: 160px !important;
          height: 100px !important;
        }

        .react-colorful__saturation {
          border-radius: 6px 6px 0 0;
        }

        .react-colorful__hue,
        .react-colorful__alpha {
          border-radius: 0 0 6px 6px;
          height: 18px !important;
          margin-top: 8px;
        }

        .react-colorful__pointer {
          width: 18px !important;
          height: 18px !important;
        }

        .react-colorful__saturation-pointer {
          width: 16px !important;
          height: 16px !important;
        }

        /* Garantir cursor correto em todo o color picker */
        .color-picker-container,
        .color-picker-container *,
        [data-radix-popper-content-wrapper],
        [data-radix-popper-content-wrapper] *,
        [data-radix-popper-content],
        [data-radix-popper-content] * {
          cursor: default !important;
        }

        /* Cursor ponteiro apenas para elementos interativos do color picker */
        .react-colorful__saturation,
        .react-colorful__hue,
        .react-colorful__alpha,
        .react-colorful__pointer,
        .react-colorful__saturation-pointer,
        .color-picker-container button,
        .color-picker-container input {
          cursor: pointer !important;
        }

        .color-picker-container input {
          cursor: text !important;
        }

        /* Proteção específica para o color picker */
        .color-picker-container {
          isolation: isolate;
          contain: layout style;
        }

        .color-picker-container,
        .color-picker-container *,
        .react-colorful,
        .react-colorful * {
          user-select: none !important;
        }

        .color-picker-container input {
          user-select: text !important;
        }

        /* Bloquear propagação de eventos no color picker */
        .react-colorful__saturation,
        .react-colorful__hue,
        .react-colorful__alpha,
        .react-colorful__pointer {
          pointer-events: auto !important;
        }
        .rich-editor[data-empty="true"]:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
          font-style: italic;
        }
        
        .rich-editor {
          position: relative;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }

        /* Remove focus outline that creates strange border */
        .rich-editor:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Ensure text divs after media are properly editable */
        .rich-editor div:not(.image-container):not(.video-preview) {
          min-height: 1.2em;
          line-height: 1.7;
        }

        /* Prevent ALL interactions with media elements in rich editor */
        .rich-editor .video-preview,
        .rich-editor .image-container img,
        .rich-editor .image-container {
          pointer-events: none !important;
          user-select: none !important;
          cursor: default !important;
        }

        /* Corrigir cursor nas áreas do rich editor onde não deve ser text cursor */
        .rich-editor .color-picker-container,
        .rich-editor .color-picker-container *,
        .rich-editor [data-radix-popper-content],
        .rich-editor [data-radix-popper-content] *,
        .react-colorful,
        .react-colorful * {
          cursor: default !important;
        }

        /* Cursor ponteiro para botões e elementos interativos */
        .rich-editor button,
        .rich-editor .react-colorful__saturation,
        .rich-editor .react-colorful__hue,
        .rich-editor .react-colorful__alpha,
        .rich-editor .react-colorful__pointer {
          cursor: pointer !important;
        }

        /* Allow delete buttons to be clickable */
        .rich-editor button[title*="Excluir"] {
          pointer-events: auto !important;
          cursor: pointer !important;
        }

        /* Specific styles for edit mode elements */
        .rich-editor .video-preview[data-edit-mode="true"] {
          pointer-events: none !important;
          user-select: none !important;
          cursor: default !important;
        }

        /* Disable ALL pointer events for video elements in edit mode */
        .rich-editor .video-preview video,
        .rich-editor .video-preview[data-edit-mode="true"] video {
          pointer-events: none !important;
          cursor: default !important;
        }

        /* Disable ALL pointer events for play overlay in edit mode */
        .rich-editor .video-preview > div:last-child,
        .rich-editor .video-preview[data-edit-mode="true"] > div:last-child {
          pointer-events: none !important;
          cursor: default !important;
          opacity: 0.5;
        }

        
        /* Better text flow and line breaks */
        .rich-editor * {
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .rich-editor p {
          margin: 0.5em 0;
          line-height: 1.7;
        }
        
        .rich-editor div {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        /* Enhanced styling for media elements in edit mode */
        .rich-editor div[contenteditable="false"] {
          position: relative;
          clear: both;
          margin: 8px 0;
          word-wrap: normal;
          overflow-wrap: normal;
        }

        /* Styling for image containers */
        .rich-editor .image-container {
          margin: 8px 0 !important;
          text-align: center;
          line-height: 0;
          max-width: 100%;
          word-wrap: normal;
          overflow-wrap: normal;
        }

        .rich-editor .image-container img {
          margin: 0 4px 4px 0 !important;
          display: inline-block !important;
          vertical-align: top !important;
          max-width: 120px !important;
          width: 120px !important;
        }

        .rich-editor .image-container img:last-child {
          margin-right: 0 !important;
        }
        
        /* Ensure proper spacing and cursor placement */
        .rich-editor div[contenteditable="false"] + div {
          min-height: 1.2em;
          margin-top: 8px;
        }
        
        /* Better handling of line breaks */
        .rich-editor br {
          display: block;
          margin: 4px 0;
          content: "";
        }
        
        /* Prevent content overflow and force smaller image size in editor */
        .rich-editor img {
          max-width: 120px !important;
          width: 120px !important;
          height: auto !important;
        }

        .rich-editor video,
        .rich-editor audio {
          max-width: 100% !important;
          height: auto !important;
        }
        
        /* Improve text selection and cursor visibility */
        .rich-editor:focus {
          caret-color: #374151;
        }
        
        /* Better handling of empty lines */
        .rich-editor div:empty:before {
          content: "\\200b"; /* Zero-width space */
          display: inline-block;
        }
        
        /* Ensure proper text wrapping */
        .rich-editor {
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        
        /* Better margin handling */
        .rich-editor > *:first-child {
          margin-top: 0;
        }
        
        .rich-editor > *:last-child {
          margin-bottom: 0;
        }
      `}</style>

      {/* Help text */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="space-y-1">
          <p className="text-xs text-gray-500">
            <strong>🚀 Recursos:</strong>{" "}
            <span className="text-purple-600">Formatação rica</span>,
            <span className="text-purple-600"> seletor de cores</span>,
            <span className="text-green-600">
              {" "}
              upload ultra-seguro com validação ClamAV-style
            </span>
            . Upload de mídia é automaticamente inserido no conteúdo.
            {isEditMode ? (
              <span className="text-orange-600">
                {" "}
                Expansão de mídia disponível ap��s publicar.
              </span>
            ) : (
              <span className="text-blue-600">
                {" "}
                Clique na mídia para expandir.
              </span>
            )}
          </p>
          {secureUploadStats && (
            <p className="text-xs text-green-600">
              🔒 Sistema de segurança: {secureUploadStats.safeFiles} arquivos
              verificados
              {secureUploadStats.quarantined.total > 0 && (
                <span className="text-orange-600">
                  {" "}
                  | {secureUploadStats.quarantined.total} em quarentena
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Modal de imagem/vídeo - only shown when not in edit mode */}
      {!isEditMode && (
        <ImageModal
          isOpen={!!modalImage}
          onClose={() => setModalImage(null)}
          src={modalImage?.src || ""}
          alt={modalImage?.alt || ""}
          isVideo={modalImage?.isVideo || false}
        />
      )}
    </div>
  );
}
