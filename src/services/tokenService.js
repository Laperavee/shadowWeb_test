import { supabase } from '../utils/supabase';
import avaxLogo from '../../dist/assets/avax_logo.png';

// En production, on utilise le chemin relatif pour les fonctions Netlify
const isProduction = import.meta.env.PROD;
const API_URL = isProduction ? '/.netlify/functions' : 'http://localhost:3002';

// Construire l'URL de l'API en fonction de l'environnement
const getApiUrl = (endpoint) => {  
  if (isProduction) {
    // Special case for token by address endpoint
    if (endpoint.startsWith('/tokens/address/')) {
      return `${API_URL}/getTokenByAddress${endpoint.substring('/tokens/address'.length)}`;
    }
    
    // Special case for tokens endpoint
    if (endpoint === '/tokens' || endpoint.startsWith('/tokens?')) {
      return `${API_URL}/getTokens${endpoint.substring('/tokens'.length)}`;
    }
    
    // Special case for token purchases endpoint
    if (endpoint.startsWith('/token_purchases')) {
      return `${API_URL}/getTokenPurchases${endpoint.substring('/token_purchases'.length)}`;
    }

    // Special case for addToken endpoint
    if (endpoint === '/addToken') {
      return `${API_URL}/addToken`;
    }
    
    // Default case - use tokens function
    return `${API_URL}/tokens${endpoint.startsWith('/tokens') ? endpoint.substring(7) : endpoint}`;
  }
  
  // En développement, on garde le préfixe /api
  const url = `${API_URL}/api${endpoint}`;
  return url;
};

async function uploadTokenImage(file) {
  if (!file) return null;

  try {
    const fileName = `${Date.now()}_${file.name}`; 
    const { data, error } = await supabase.storage.from('images').upload(fileName, file);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: { signedUrl } } = await supabase.storage
      .from('images')
      .createSignedUrl(fileName, 365 * 24 * 60 * 60); 

    return signedUrl;
  } catch (error) {
    console.error('Error in uploadTokenImage:', error);
    return null;
  }
}

export const tokenService = {
  async getTokens(network) {
    try {
      const url = getApiUrl(`/tokens?network=${network}`);      
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TokenService] HTTP Error ${response.status}: ${errorText}`);
        throw new Error(`Failed to fetch tokens: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();      
      if (!result.success) {
        console.error('[TokenService] API Error:', result.error);
        throw new Error(result.error || 'Failed to fetch tokens');
      }
      const tokens = result.data;
      if (!tokens) {
        console.warn('[TokenService] No tokens returned from API');
        return [];
      }
      const uniqueTokens = tokens.reduce((acc, current) => {
        const x = acc.find(item => item.token_address === current.token_address);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      return uniqueTokens;
    } catch (error) {
      console.error('[TokenService] Error:', error);
      throw error;
    }
  },

  async getTokensByCreator(creator) {
    try {
      const response = await fetch(getApiUrl(`/tokens/creator/${creator}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch creator tokens');
      }

      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching creator tokens:', error);
      throw error;
    }
  },

  async getTokenByAddress(address) {
    try {
      const url = getApiUrl(`/tokens/address/${address}`);      
      const response = await fetch(url);      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TokenService] HTTP Error ${response.status}: ${errorText}`);
        return { data: null, error: `Token not found: ${response.status} ${response.statusText}` };
      }

      const result = await response.json();      
      if (!result.success) {
        console.error('[TokenService] API Error:', result.error);
        return { data: null, error: result.error || 'Token not found' };
      }

      return { data: result.data };
    } catch (error) {
      console.error('Error fetching token:', error);
      return { data: null, error };
    }
  },

  async getTopHolderPurchases(tokenAddress) {
    try {
      const url = getApiUrl(`/token_purchases/${tokenAddress}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TokenService] Error content:', errorText);
        return { data: [], error: `Failed to fetch transactions: ${response.status} ${response.statusText}` };
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        console.warn('[TokenService] No data in response');
        return { data: [], error: 'No data returned from API' };
      }
      
      const formattedData = result.data.map(tx => {
        const date = new Date(tx.purchased_at);        
        const formattedDate = !isNaN(date.getTime()) 
          ? date.toLocaleString('en-US', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          : 'Unknown date';
        return {
          action: tx.action ? 'BUY' : 'SELL',
          amount: tx.amount ? (parseFloat(tx.amount) / 1e18).toFixed(3) : '0',
          cost: tx.cost ? `$${parseFloat(tx.cost).toFixed(3)}` : '$0.00',
          date: formattedDate,
          tx_hash: tx.tx_hash,
          user_id: tx.user_id
        };
      });

      return { data: formattedData };
    } catch (error) {
      console.error('[TokenService] Unexpected error:', error);
      return { data: [], error };
    }
  },

  async insertToken({
    token_address,
    token_name,
    token_symbol,
    supply,
    liquidity,
    max_wallet_percentage,
    network,
    deployer_address,
    token_image,
    twitter_handle,
    website_url,
    is_fresh
  }) {
    try {
      // Convertir les valeurs numériques en chaînes de caractères
      const tokenData = {
        token_address: token_address.toString(),
        token_name: token_name.toString(),
        token_symbol: token_symbol.toString(),
        supply: supply.toString(),
        liquidity: liquidity.toString(),
        max_wallet_percentage: max_wallet_percentage.toString(),
        network: network.toString(),
        deployer_address: deployer_address.toString(),
        twitter_handle: twitter_handle?.toString() || null,
        website_url: website_url?.toString() || null,
        is_fresh: Boolean(is_fresh)
      };

      // Gérer l'image du token si elle existe
      if (token_image) {
        const imageUrl = await this.uploadTokenImage(token_image);
        if (imageUrl) {
          tokenData.token_image = imageUrl;
        }
      }

      const response = await fetch(getApiUrl('/addToken'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error inserting token:', error);
      throw error;
    }
  },

  async addTestToken() {
    try {
      const response = await fetch(avaxLogo);
      const blob = await response.blob();
      const imageFile = new File([blob], 'avax_logo.png', { type: 'image/png' });

      const tokenData = {
        token_address: '0x1234567890123456789012345678901234567890',
        token_name: 'Test Token',
        token_symbol: 'TEST',
        supply: 1000000,
        liquidity: 1000,
        max_wallet_percentage: 5,
        network: 'AVAX',
        deployer_address: '0x0000000000000000000000000000000000000000',
        token_image: imageFile
      };

      return await this.insertToken(tokenData);
    } catch (error) {
      console.error('Error in addTestToken:', error);
      throw error;
    }
  }
}; 