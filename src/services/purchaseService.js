import { API_URL, CACHE_DURATION } from '../utils/constants';

// In production, use relative path for Netlify functions
const isProduction = import.meta.env.PROD;
const API_URL = isProduction ? '/.netlify/functions' : 'http://localhost:3002';

// Build API URL based on environment
const getApiUrl = (endpoint) => {
  if (isProduction) {
    // In production, call tokens function directly without adding /tokens
    return `${API_URL}/tokens${endpoint.startsWith('/tokens') ? endpoint.substring(7) : endpoint}`;
  }
  // In development, keep /api prefix
  return `${API_URL}/api${endpoint}`;
};

// Cache for requests
const cache = new Map();

class PurchaseService {
  async getTokenPurchases(tokenAddress) {
    try {
      if (!tokenAddress) {
        console.warn('[Purchase Service] No token address provided');
        return null;
      }      
      const cacheKey = `purchases-${tokenAddress}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
      const url = `${API_URL}/tokens/${tokenAddress}/top-holder-purchases`;      
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
    cache.clear();
  }
}

export const purchaseService = new PurchaseService(); 