// En production, on utilise le chemin relatif pour les fonctions Netlify
const isProduction = process.env.NODE_ENV === 'production';
const API_URL = isProduction ? '/.netlify/functions' : 'http://localhost:3002';

// Fonction utilitaire pour gérer les réponses API
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Une erreur est survenue');
  }
  return response.json();
};

export const newsService = {
  // Récupérer toutes les actualités
  getNews: async () => {
    try {
      const response = await fetch(`${API_URL}/getNews`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  },

  // Récupérer un post spécifique
  getPost: async (id) => {
    try {
      const response = await fetch(`${API_URL}/getPost?id=${id}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Formater les données d'une actualité
  formatNews: (news) => {
    return {
      ...news,
      created_at: new Date(news.created_at).toLocaleString(),
      updated_at: new Date(news.updated_at).toLocaleString(),
    };
  },

  // Formater les données de plusieurs actualités
  formatNewsList: (newsList) => {
    return newsList.map(news => newsService.formatNews(news));
  }
}; 