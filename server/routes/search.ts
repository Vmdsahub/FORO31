import { RequestHandler } from "express";

export interface SearchResult {
  id: string;
  title: string;
  category: string;
  author: string;
  categoryType: "tools" | "opensource";
}

export const searchHandler: RequestHandler = async (req, res) => {
  try {
    const { q: query, type, categories } = req.query;

    if (!query || typeof query !== "string" || query.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Query is required and must be at least 1 character long",
      });
    }

    const searchQuery = query.trim().toLowerCase();
    const searchType = type as string;
    const searchCategories = Array.isArray(categories) 
      ? categories as string[] 
      : categories 
      ? [categories as string] 
      : [];

    if (searchType === "users") {
      // For now, return empty results for user search
      // This would be implemented to search through user profiles
      return res.json({
        success: true,
        results: [],
        total: 0,
      });
    }

    // Search through topics
    const results: SearchResult[] = [];

    // This is a mock implementation. In a real app, you would:
    // 1. Query your database for topics matching the search criteria
    // 2. Filter by the selected categories
    // 3. Search in title, content, or other relevant fields
    
    // Mock data for demonstration
    const mockTopics = [
      {
        id: "1",
        title: "Como usar ChatGPT para programação",
        category: "LLMs",
        author: "João Silva",
        categoryType: "tools" as const,
        categoryId: "llms"
      },
      {
        id: "2", 
        title: "Stable Diffusion vs DALL-E comparação",
        category: "Imagem",
        author: "Maria Costa",
        categoryType: "opensource" as const,
        categoryId: "opensource-imagem"
      },
      {
        id: "3",
        title: "Tutorial de edição de vídeo com AI",
        category: "Vídeo", 
        author: "Pedro Santos",
        categoryType: "tools" as const,
        categoryId: "video"
      },
      {
        id: "4",
        title: "Problemas com instalação do Llama",
        category: "Dúvidas/Erros",
        author: "Ana Oliveira",
        categoryType: "opensource" as const,
        categoryId: "opensource-duvidas-erros"
      },
      {
        id: "5",
        title: "Criando música com AI: primeiros passos",
        category: "Música/Áudio",
        author: "Carlos Mendes",
        categoryType: "tools" as const,
        categoryId: "musica-audio"
      },
    ];

    // Filter topics based on search criteria
    const filteredTopics = mockTopics.filter(topic => {
      // Check if title contains search query
      const titleMatch = topic.title.toLowerCase().includes(searchQuery);
      
      // Check if topic's category is in selected categories
      const categoryMatch = searchCategories.length === 0 || 
        searchCategories.includes(topic.categoryId);
      
      return titleMatch && categoryMatch;
    });

    // Map to search result format
    const searchResults: SearchResult[] = filteredTopics.map(topic => ({
      id: topic.id,
      title: topic.title,
      category: topic.category,
      author: topic.author,
      categoryType: topic.categoryType,
    }));

    res.json({
      success: true,
      results: searchResults,
      total: searchResults.length,
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during search",
    });
  }
};
