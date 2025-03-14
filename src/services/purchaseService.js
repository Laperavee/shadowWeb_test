import { API_URL, CACHE_DURATION } from '../utils/constants';

// En production, on utilise le chemin relatif pour les fonctions Netlify
const isProduction = import.meta.env.PROD;
const API_URL = isProduction ? '/.netlify/functions' : 'http://localhost:3002';

// Construire l'URL de l'API en fonction de l'environnement
const getApiUrl = (endpoint) => {
  if (isProduction) {
    // En production, on appelle directement la fonction tokens sans ajouter /tokens
    return `${API_URL}/tokens${endpoint.startsWith('/tokens') ? endpoint.substring(7) : endpoint}`;
  }
  // En développement, on garde le préfixe /api
  return `${API_URL}/api${endpoint}`;
};

// Cache pour les requêtes
const cache = new Map();

class PurchaseService {
  async getTokenPurchases(tokenAddress) {
    try {
      if (!tokenAddress) {
        console.warn('[Purchase Service] No token address provided');
        return null;
      }

      console.log('[Purchase Service] Starting request for:', tokenAddress);
      
      const cacheKey = `purchases-${tokenAddress}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.debug('[Purchase Service] Returning cached data for:', tokenAddress);
        return cached.data;
      }

      console.debug('[Purchase Service] Fetching purchases for:', tokenAddress);
      const url = `${API_URL}/tokens/${tokenAddress}/top-holder-purchases`;
      console.log('[Purchase Service] Full request URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('[Purchase Service] Failed request details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          responseText: await response.text()
        });
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.debug('[Purchase Service] Successfully fetched purchases:', result.data);
        cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now()
        });
        
        return result.data;
      }
      
      console.warn('[Purchase Service] Invalid response:', result);
      return null;
    } catch (error) {
      console.error('[Purchase Service] Error fetching purchases:', {
        message: error.message,
        stack: error.stack,
        tokenAddress
      });
      return null;
    }
  }

  clearCache() {
    console.debug('[Purchase Service] Clearing cache');
    cache.clear();
  }
}

export const purchaseService = new PurchaseService(); 