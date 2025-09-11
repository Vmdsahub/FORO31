import { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Bold, Italic, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CuriosityText {
  id: string;
  content: string;
  createdAt: Date;
}

interface CuriosityModalProps {
  isOpen: boolean;
  onClose: () => void;
  texts: CuriosityText[];
  onUpdateTexts: (texts: CuriosityText[]) => void;
}

const CuriosityModal: React.FC<CuriosityModalProps> = ({
  isOpen,
  onClose,
  texts,
  onUpdateTexts,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [newTextContent, setNewTextContent] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleAddText = () => {
    if (!newTextContent.trim()) {
      toast.error("Por favor, digite um texto para adicionar");
      return;
    }

    if (newTextContent.length > 200) {
      toast.error("O texto deve ter no máximo 200 caracteres");
      return;
    }

    const newText: CuriosityText = {
      id: generateId(),
      content: newTextContent.trim(),
      createdAt: new Date(),
    };

    onUpdateTexts([...texts, newText]);
    setNewTextContent("");
    setIsAddingNew(false);
    toast.success("Texto adicionado com sucesso!");
  };

  const handleEditText = (id: string) => {
    const text = texts.find((t) => t.id === id);
    if (text) {
      setEditingId(id);
      setEditingContent(text.content);
    }
  };

  const handleSaveEdit = () => {
    if (!editingContent.trim()) {
      toast.error("O texto não pode estar vazio");
      return;
    }

    if (editingContent.length > 200) {
      toast.error("O texto deve ter no máximo 200 caracteres");
      return;
    }

    const updatedTexts = texts.map((text) =>
      text.id === editingId
        ? { ...text, content: editingContent.trim() }
        : text
    );

    onUpdateTexts(updatedTexts);
    setEditingId(null);
    setEditingContent("");
    toast.success("Texto atualizado com sucesso!");
  };

  const handleDeleteText = (id: string) => {
    if (texts.length <= 1) {
      toast.error("Deve haver pelo menos um texto de curiosidade");
      return;
    }

    const updatedTexts = texts.filter((text) => text.id !== id);
    onUpdateTexts(updatedTexts);
    toast.success("Texto removido com sucesso!");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const insertFormatting = (format: 'bold' | 'italic', textareaRef: HTMLTextAreaElement | null) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = textareaRef.value.substring(start, end);
    
    const formatChar = format === 'bold' ? '**' : '*';
    const formattedText = `${formatChar}${selectedText || 'texto'}${formatChar}`;
    
    const newValue = textareaRef.value.substring(0, start) + formattedText + textareaRef.value.substring(end);
    
    if (editingId) {
      setEditingContent(newValue);
    } else {
      setNewTextContent(newValue);
    }
    
    // Reposicionar cursor
    setTimeout(() => {
      const newCursorPos = start + formattedText.length;
      textareaRef.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.focus();
    }, 0);
  };

  const renderTextPreview = (content: string) => {
    // Converter **texto** para <strong>texto</strong>
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Converter *texto* para <em>texto</em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Gerenciar Textos de Curiosidade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de Textos Existentes */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-700">
              Textos Atuais ({texts.length})
            </h3>
            
            {texts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum texto de curiosidade cadastrado</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {texts.map((text) => (
                  <div
                    key={text.id}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {editingId === text.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const textarea = document.getElementById(`edit-textarea-${text.id}`) as HTMLTextAreaElement;
                              insertFormatting('bold', textarea);
                            }}
                            className="px-2 py-1"
                          >
                            <Bold className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const textarea = document.getElementById(`edit-textarea-${text.id}`) as HTMLTextAreaElement;
                              insertFormatting('italic', textarea);
                            }}
                            className="px-2 py-1"
                          >
                            <Italic className="w-3 h-3" />
                          </Button>
                          <span className="text-xs text-gray-500">
                            {editingContent.length}/200
                          </span>
                        </div>
                        <Textarea
                          id={`edit-textarea-${text.id}`}
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          placeholder="Digite o texto de curiosidade..."
                          className="min-h-[80px] resize-none"
                          maxLength={200}
                        />
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <div className="text-sm text-gray-700 leading-relaxed">
                            {renderTextPreview(text.content)}
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            Criado em {text.createdAt.toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditText(text.id)}
                            className="px-2 py-1"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteText(text.id)}
                            className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={texts.length <= 1}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adicionar Novo Texto */}
          <div className="border-t pt-4">
            {isAddingNew ? (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-700">
                  Adicionar Novo Texto
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const textarea = document.getElementById('new-textarea') as HTMLTextAreaElement;
                      insertFormatting('bold', textarea);
                    }}
                    className="px-2 py-1"
                  >
                    <Bold className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const textarea = document.getElementById('new-textarea') as HTMLTextAreaElement;
                      insertFormatting('italic', textarea);
                    }}
                    className="px-2 py-1"
                  >
                    <Italic className="w-3 h-3" />
                  </Button>
                  <span className="text-xs text-gray-500">
                    {newTextContent.length}/200
                  </span>
                </div>
                <Textarea
                  id="new-textarea"
                  value={newTextContent}
                  onChange={(e) => setNewTextContent(e.target.value)}
                  placeholder="Digite um novo texto de curiosidade..."
                  className="min-h-[80px] resize-none"
                  maxLength={200}
                />
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleAddText}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewTextContent("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingNew(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Texto
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CuriosityModal;