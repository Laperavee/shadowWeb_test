/**
 * Service to manage token prices with caching
 * Centralizes CoinGecko calls to avoid rate limiting issues
 */

class PriceService {
  constructor() {
    // Price cache with validity duration
    this.priceCache = {
      data: {},
      timestamp: null,
      // Cache validity duration in milliseconds (5 minutes)
      cacheDuration: 5 * 60 * 1000
    };
    
    // List of tokens to track
    this.tokenIds = ['avalanche-2', 'ethereum'];
    
    // Custom event for price updates
    this.priceUpdateEvent = new CustomEvent('priceUpdate');
    
    // Initialize prices at startup
    this.fetchPrices();
    
    // Set up periodic updates (every 5 minutes)
    this.startPeriodicUpdate();
  }
  
  /**
   * Start periodic price updates
   */
  startPeriodicUpdate() {
    // Update prices every 5 minutes
    this.updateInterval = setInterval(() => {
      this.fetchPrices();
    }, this.priceCache.cacheDuration);
  }
  
  /**
   * Stop periodic price updates
   */
  stopPeriodicUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
  
  /**
   * Récupère les prix depuis CoinGecko et met à jour le cache
   */
  async fetchPrices() {
    try {
      console.log('PriceService - Fetching prices from CoinGecko');
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${this.tokenIds.join(',')}&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Mettre à jour le cache
      this.priceCache = {
        data: {
          AVAX: data['avalanche-2']?.usd || 0,
          ETH: data['ethereum']?.usd || 0
        },
        timestamp: Date.now(),
        cacheDuration: this.priceCache.cacheDuration
      };
      
      // Émettre l'événement de mise à jour des prix
      window.dispatchEvent(new CustomEvent('priceUpdate', { detail: this.priceCache.data }));
      
      console.log('PriceService - Prices updated:', this.priceCache.data);
      
      return this.priceCache.data;
    } catch (error) {
      console.error('PriceService - Error fetching prices:', error);
      // En cas d'erreur, on retourne les données en cache si elles existent
      return this.priceCache.data;
    }
  }
  
  /**
   * Check if cache is valid
   */
  isCacheValid() {
    if (!this.priceCache.timestamp) return false;
    
    const now = Date.now();
    const cacheAge = now - this.priceCache.timestamp;
    
    return cacheAge < this.priceCache.cacheDuration;
  }
  
  /**
   * Get prices, from cache if valid, otherwise from API
   */
  async getPrices() {
    if (this.isCacheValid()) {
      console.log('PriceService - Using cached prices');
      return this.priceCache.data;
    }
    
    return this.fetchPrices();
  }
  
  /**
   * Récupère le prix d'un token spécifique
   * @param {string} symbol - Symbole du token (AVAX, ETH, etc.)
   */
  async getPrice(symbol) {
    const prices = await this.getPrices();
    return prices[symbol] || 0;
  }
  
  /**
   * Convertit une valeur en USD
   * @param {number} amount - Montant à convertir
   * @param {string} symbol - Symbole du token (AVAX, ETH, etc.)
   */
  async convertToUSD(amount, symbol) {
    const price = await this.getPrice(symbol);
    return amount * price;
  }
  
  /**
   * S'abonne aux mises à jour de prix
   * @param {Function} callback - Fonction à appeler lors des mises à jour
   */
  subscribeToUpdates(callback) {
    const handler = (event) => callback(event.detail);
    window.addEventListener('priceUpdate', handler);
    
    // Retourner une fonction pour se désabonner
    return () => {
      window.removeEventListener('priceUpdate', handler);
    };
  }
}

// Export a single instance of the service
export const priceService = new PriceService(); 