import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CuriosityModal from "./CuriosityModal";
import { useAuth } from "@/contexts/AuthContext";

interface CuriosityText {
  id: string;
  content: string;
  createdAt: Date;
}

interface CuriosityButtonProps {
  className?: string;
}

const CuriosityButton: React.FC<CuriosityButtonProps> = ({ className = "" }) => {
  const { isAdmin } = useAuth();
  const [curiosityTexts, setCuriosityTexts] = useState<CuriosityText[]>([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Carregar textos do localStorage na inicialização
  useEffect(() => {
    const savedTexts = localStorage.getItem('curiosityTexts');
    if (savedTexts) {
      try {
        const parsedTexts = JSON.parse(savedTexts).map((text: any) => ({
          ...text,
          createdAt: new Date(text.createdAt)
        }));
        setCuriosityTexts(parsedTexts);
      } catch (error) {
        console.error('Erro ao carregar textos de curiosidade:', error);
        // Textos padrão caso haja erro
        setDefaultTexts();
      }
    } else {
      // Textos padrão se não houver nada salvo
      setDefaultTexts();
    }
  }, []);

  const setDefaultTexts = () => {
    const defaultTexts: CuriosityText[] = [
      {
        id: '1',
        content: '🤖 **Você sabia?** A primeira IA conversacional foi criada em 1966 e se chamava ELIZA!',
        createdAt: new Date()
      },
      {
        id: '2', 
        content: '🧠 **Curiosidade:** O cérebro humano processa informações a cerca de 20 watts - menos que uma lâmpada!',
        createdAt: new Date()
      },
      {
        id: '3',
        content: '⚡ **Fato interessante:** GPT-3 tem 175 bilhões de parâmetros, mas ainda não consegue *realmente* entender como você!',
        createdAt: new Date()
      }
    ];
    setCuriosityTexts(defaultTexts);
    localStorage.setItem('curiosityTexts', JSON.stringify(defaultTexts));
  };

  // Salvar textos no localStorage sempre que mudarem
  useEffect(() => {
    if (curiosityTexts.length > 0) {
      localStorage.setItem('curiosityTexts', JSON.stringify(curiosityTexts));
    }
  }, [curiosityTexts]);

  const handleCuriosityClick = () => {
    if (curiosityTexts.length === 0) return;
    
    // Avançar para o próximo texto
    setCurrentTextIndex((prev) => (prev + 1) % curiosityTexts.length);
    
    // Mostrar tooltip
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    // Esconder tooltip quando o mouse sair do botão
    setShowTooltip(false);
  };

  const updateTexts = (newTexts: CuriosityText[]) => {
    setCuriosityTexts(newTexts);
    // Ajustar índice se necessário
    if (newTexts.length > 0 && currentTextIndex >= newTexts.length) {
      setCurrentTextIndex(0);
    }
  };

  const renderTextWithFormatting = (text: string) => {
    // Converter **texto** para <strong>texto</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Converter *texto* para <em>texto</em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const currentText = curiosityTexts[currentTextIndex];

  return (
    <div className={`flex items-center space-x-2 z-10 ${className}`}>
      {/* Botão Principal de Curiosidade */}
      <TooltipProvider>
        <Tooltip open={showTooltip}>
          <TooltipTrigger asChild>
            <Button
              onClick={handleCuriosityClick}
              onMouseLeave={handleMouseLeave}
              size="lg"
              className="w-12 h-12 rounded-full p-0 bg-white hover:bg-gray-50 text-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200 flex items-center justify-center"
              disabled={curiosityTexts.length === 0}
            >
              <span className="text-2xl font-bold text-gray-700">?</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            key={currentTextIndex}
            side="right" 
            className="max-w-xs p-3 bg-white border border-gray-200 shadow-lg rounded-lg transition-all duration-300 ease-in-out animate-in fade-in-0 zoom-in-95"
            sideOffset={5}
          >
            {currentText ? (
              <div className="text-sm text-gray-700 leading-relaxed transition-all duration-300">
                {renderTextWithFormatting(currentText.content)}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum texto de curiosidade disponível</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Botão de Configuração - Apenas para Admins */}
      {isAdmin && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                variant="outline"
                className="w-8 h-8 rounded-full p-0 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Configurar textos de curiosidade</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Modal de Configuração */}
      <CuriosityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        texts={curiosityTexts}
        onUpdateTexts={updateTexts}
      />
    </div>
  );
};

export default CuriosityButton;