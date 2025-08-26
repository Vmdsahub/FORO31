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
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredTopics.length);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + featuredTopics.length) % featuredTopics.length);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8 shadow-sm">
      <div className="relative">
        {/* Main Carousel Container */}
        <div className="relative h-80 overflow-hidden rounded-xl">
          {/* Background Image */}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${
              isTransitioning ? 'opacity-70 scale-105' : 'opacity-100 scale-100'
            }`}
            style={{
              backgroundImage: currentTopic.featuredImageUrl
                ? `url(${currentTopic.featuredImageUrl})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 featured-topic-overlay"></div>
          </div>

          {/* Title in top-left corner */}
          <div className={`absolute top-6 left-6 z-10 transition-all duration-300 ${
            isTransitioning ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
          }`}>
            <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">Tópicos em Destaque</h2>
          </div>

          {/* Content */}
          <div className={`relative h-full flex items-end p-6 transition-all duration-300 ${
            isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
          }`}>
            <div className="text-white max-w-2xl">
              <Link
                to={`/topic/${currentTopic.id}`}
                className="block hover:opacity-80 transition-opacity"
              >
                <h3 className="text-2xl font-bold mb-2 line-clamp-2 drop-shadow-lg">
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
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white backdrop-blur-sm"
                aria-label="Tópico anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white backdrop-blur-sm"
                aria-label="Próximo tópico"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>


      </div>
    </div>
  );
}
