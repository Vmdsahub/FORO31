import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Topic } from "@shared/forum";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedTopic extends Topic {
  featuredImageUrl?: string;
  carouselPosition: number; // 1, 2, 3, ou 4
}

interface FeaturedCarouselProps {
  isAdmin?: boolean;
}

export default function FeaturedCarousel({ isAdmin }: FeaturedCarouselProps) {
  const [featuredTopics, setFeaturedTopics] = useState<FeaturedTopic[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar tópicos em destaque
  useEffect(() => {
    fetchFeaturedTopics();
  }, []);

  // Auto-rotation a cada 10 segundos
  useEffect(() => {
    if (featuredTopics.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredTopics.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [featuredTopics.length]);

  const fetchFeaturedTopics = async () => {
    try {
      const response = await fetch("/api/featured-topics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeaturedTopics(data.topics || []);
      }
    } catch (error) {
      console.error("Error fetching featured topics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredTopics.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredTopics.length) % featuredTopics.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Tópicos em Destaque</h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando tópicos em destaque...</p>
        </div>
      </div>
    );
  }

  if (featuredTopics.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Tópicos em Destaque</h2>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p>Nenhum tópico em destaque no momento.</p>
          {isAdmin && (
            <p className="text-sm mt-2">Use o símbolo 🍀 em tópicos para adicioná-los aos destaques.</p>
          )}
        </div>
      </div>
    );
  }

  const currentTopic = featuredTopics[currentSlide];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-black">Tópicos em Destaque</h2>
      </div>
      
      <div className="relative">
        {/* Main Carousel Container */}
        <div className="relative h-80 overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-500"
            style={{
              backgroundImage: currentTopic.featuredImageUrl
                ? `url(${currentTopic.featuredImageUrl})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 featured-topic-overlay"></div>
          </div>

          {/* Content */}
          <div className="relative h-full flex items-end p-6">
            <div className="text-white max-w-2xl">
              <Link 
                to={`/topic/${currentTopic.id}`}
                className="block hover:opacity-80 transition-opacity"
              >
                <h3 className="text-2xl font-bold mb-2 line-clamp-2">
                  {currentTopic.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-200">
                  <span>por <strong>{currentTopic.author}</strong></span>
                  <span className="flex items-center gap-1">
                    💬 {currentTopic.replies} comentários
                  </span>
                  <span className="flex items-center gap-1">
                    ❤️ {currentTopic.likes} likes
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation Arrows */}
          {featuredTopics.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white backdrop-blur-sm"
                aria-label="Tópico anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white backdrop-blur-sm"
                aria-label="Próximo tópico"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Dots Navigation */}
        {featuredTopics.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {featuredTopics.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Ir para tópico ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Thumbnail Preview */}
        {featuredTopics.length > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-3 overflow-x-auto">
              {featuredTopics.map((topic, index) => (
                <button
                  key={topic.id}
                  onClick={() => goToSlide(index)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentSlide 
                      ? 'border-black shadow-md' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: topic.featuredImageUrl 
                        ? `url(${topic.featuredImageUrl})` 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    {!topic.featuredImageUrl && (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-semibold">
                        {topic.title.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
