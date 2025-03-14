import { API_URL, CACHE_DURATION } from '../utils/constants';

// Cache pour les requêtes
const cache = new Map();

// En production, on utilise le chemin relatif pour les fonctions Netlify
const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction ? '/api' : 'http://localhost:3002/api';

class MarketDataService {
  async getMarketData(tokenAddress, network) {
    try {
      if (!tokenAddress) {
        console.warn('[Market Data] No token address provided to getMarketData');
        return null;
      }

      console.log('[Market Data] Starting request for:', tokenAddress, 'on network:', network);

      const cacheKey = `market-data-${tokenAddress}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.debug('[Market Data] Returning cached data for:', tokenAddress);
        return cached.data;
      }

      console.debug('[Market Data] Fetching data for:', tokenAddress);
      const url = `${API_BASE_URL}/market-data/${tokenAddress}?network=${network || ''}`;
      console.log('[Market Data] Full request URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('[Market Data] Failed request details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          responseText: await response.text()
        });
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.debug('[Market Data] Successfully fetched data:', result.data);
        cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now()
        });
        
        return result.data;
      }
      
      console.warn('[Market Data] Invalid response:', result);
      return null;
    } catch (error) {
      console.error('[Market Data] Detailed error:', {
        message: error.message,
        stack: error.stack,
        tokenAddress,
        network
      });
      return null;
    }
  }

  async refreshMarketData(tokenAddress, network) {
    try {
      console.debug('[Market Data] Forcing refresh for:', tokenAddress);
      const response = await fetch(
        `${API_BASE_URL}/market-data/${tokenAddress}/refresh?network=${network || ''}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        console.error('[Market Data] Refresh failed:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.debug('[Market Data] Successfully refreshed data for:', tokenAddress);
        cache.set(`market-data-${tokenAddress}`, {
          data: result.data,
          timestamp: Date.now()
        });
        
        return result.data;
      }
      
      console.warn('[Market Data] Invalid refresh response:', result);
      return null;
    } catch (error) {
      console.error('[Market Data] Refresh error:', error);
      return null;
    }
  }

  async updateMarketData(tokenAddress, marketData) {
    try {
      console.debug('[Market Data] Updating data for:', tokenAddress);
      const response = await fetch(`${API_BASE_URL}/market-data/${tokenAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(marketData),
      });
      
      if (!response.ok) {
        console.error('[Market Data] Update failed:', response.status, response.statusText);
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.debug('[Market Data] Successfully updated data for:', tokenAddress);
        cache.set(`market-data-${tokenAddress}`, {
          data: result.data,
          timestamp: Date.now()
        });
        
        return result.data;
      }
      
      console.warn('[Market Data] Invalid update response:', result);
      return null;
    } catch (error) {
      console.error('[Market Data] Update error:', error);
      return null;
    }
  }

  clearCache() {
    console.debug('[Market Data] Clearing cache');
    cache.clear();
  }
}

export const marketDataService = new MarketDataService(); 