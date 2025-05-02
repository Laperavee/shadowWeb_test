import { API_URL, CACHE_DURATION } from '../utils/constants';
import { priceService } from './priceService';

// Cache pour les requêtes
const cache = new Map();

// En production, on utilise le chemin relatif pour les fonctions Netlify
const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction ? '/api' : 'http://localhost:3002/api';

class MarketDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute en millisecondes
  }

  async getTokenMarketData(tokenAddress, network) {
    const cacheKey = `${network}-${tokenAddress}`;
    const cachedData = this.cache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < this.cacheTimeout) {
      return cachedData.data;
    }

    try {
      const definedNetwork = network?.toUpperCase() === 'AVAX' ? 'avalanche' : network?.toLowerCase();
      const response = await fetch(`https://api.defined.fi/v1/tokens/${tokenAddress}`);
      const data = await response.json();
      
      if (data && data.pairs && data.pairs.length > 0) {
        const sortedPairs = data.pairs.sort((a, b) => 
          parseFloat(b.volumeUsd24h || 0) - parseFloat(a.volumeUsd24h || 0)
        );
        
        const mainPair = sortedPairs[0];
        
        if (mainPair) {
          const marketData = {
            price: parseFloat(mainPair.priceUsd || 0),
            marketCap: parseFloat(mainPair.fdv || 0),
            priceChange24h: parseFloat(mainPair.priceChange?.h24 || 0),
            volume24h: parseFloat(mainPair.volume?.h24 || 0),
            liquidity: parseFloat(mainPair.liquidity?.usd || 0) / 1000
          };

          this.cache.set(cacheKey, {
            data: marketData,
            timestamp: Date.now()
          });

          return marketData;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }

  async getBatchMarketData(tokens) {
    const promises = tokens.map(token => 
      this.getTokenMarketData(token.token_address, token.network)
    );
    
    const results = await Promise.all(promises);
    
    return tokens.map((token, index) => ({
      ...token,
      market_data: results[index]
    }));
  }

  async getMarketData(tokenAddress, network) {
    try {
      if (!tokenAddress) {
        console.warn('[Market Data] No token address provided to getMarketData');
        return null;
      }
      const cacheKey = `market-data-${tokenAddress}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const url = `${API_BASE_URL}/market-data/${tokenAddress}?network=${network || ''}`;
      
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
    this.cache.clear();
  }
}

export const marketDataService = new MarketDataService(); 