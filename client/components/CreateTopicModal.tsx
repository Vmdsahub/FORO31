import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Topic } from "@shared/forum";
import TopicCreate from "@/components/TopicCreate";

// Função para upload de imagem (placeholder - implementar conforme necessário)
async function uploadImage(file: File): Promise<string | null> {
  try {
    // Por enquanto, criar uma URL temporária para a imagem
    // Em produção, implementar upload real para servidor/cloud
    return URL.createObjectURL(file);
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    return null;
  }
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
}

interface CreateTopicModalProps {
  currentCategory: ForumCategory;
  onTopicCreated?: (newTopic: Topic) => void;
  onStatsRefresh?: () => void;
}

export default function CreateTopicModal({
  currentCategory,
  onTopicCreated,
  onStatsRefresh,
}: CreateTopicModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [topicImage, setTopicImage] = useState<File | null>(null);

  const handleSave = async (data: { delta: any; image: File | null }) => {
    if (!user) {
      toast.error("Faça login para criar tópicos");
      return;
    }

    // Validar se há conteúdo real no delta
    const hasContent = data.delta && 
      data.delta.ops && 
      data.delta.ops.length > 0 && 
      data.delta.ops.some((op: any) => op.insert && op.insert.trim && op.insert.trim().length > 0);

    if (!title.trim() || !hasContent) {
      toast.error("Preencha o título e o conteúdo");
      return;
    }

    setIsSubmitting(true);
    try {
      const topicData = {
        title: title.trim(),
        content: JSON.stringify(data.delta), // Salvar Delta como JSON
        category: currentCategory.id,
        image: topicImage ? await uploadImage(topicImage) : null,
      };

      const response = await fetch("/api/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(topicData),
      });

      if (response.ok) {
        const newTopic = await response.json();
        toast.success("Tópico criado com sucesso!");
        setTitle("");
        setTopicImage(null);
        setIsOpen(false);
        onTopicCreated?.(newTopic);
        onStatsRefresh?.();
        // Redirecionar para a página do tópico criado
        navigate(`/topic/${newTopic.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Erro ao criar tópico");
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("Erro ao criar tópico");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black text-white hover:bg-gray-800">
          Criar Tópico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Tópico em {currentCategory.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Título com imagem circular ao lado - alinhado com as bordas do editor */}
          <div className="max-w-[790px] mx-auto px-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => document.getElementById('topic-image-upload')?.click()}
              className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {topicImage ? (
                <img 
                  src={URL.createObjectURL(topicImage)} 
                  alt="Preview" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do tópico"
              maxLength={70}
              className="flex-1 text-base"
            />
            <input
              id="topic-image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setTopicImage(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          <TopicCreate 
            onSave={handleSave} 
            onCancel={() => setIsOpen(false)}
            image={topicImage}
            onImageChange={setTopicImage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}