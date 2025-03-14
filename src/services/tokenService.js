import { supabase } from '../utils/supabase';
import avaxLogo from '../../dist/assets/avax_logo.png';

// En production, on utilise le chemin relatif pour les fonctions Netlify
const isProduction = import.meta.env.PROD;
const API_URL = isProduction ? '/.netlify/functions' : 'http://localhost:3002';

// Construire l'URL de l'API en fonction de l'environnement
const getApiUrl = (endpoint) => {
  console.log(`[getApiUrl] Building URL for endpoint: ${endpoint}`);
  
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
    
    // Default case - use tokens function
    return `${API_URL}/tokens${endpoint.startsWith('/tokens') ? endpoint.substring(7) : endpoint}`;
  }
  
  // En développement, on garde le préfixe /api
  const url = `${API_URL}/api${endpoint}`;
  console.log(`[getApiUrl] Final URL: ${url}`);
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
      console.log(`[TokenService] Constructed URL for fetching tokens: ${url}`);
      
      const response = await fetch(url);
      console.log(`[TokenService] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TokenService] HTTP Error ${response.status}: ${errorText}`);
        throw new Error(`Failed to fetch tokens: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[TokenService] API response received:`, result);
      
      if (!result.success) {
        console.error('[TokenService] API Error:', result.error);
        throw new Error(result.error || 'Failed to fetch tokens');
      }

      const tokens = result.data;
      
      if (!tokens) {
        console.warn('[TokenService] No tokens returned from API');
        return [];
      }

      console.log(`[TokenService] Successfully loaded ${tokens.length} tokens`);

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
      console.log(`[TokenService] Fetching token by address: ${address}`);
      console.log(`[TokenService] URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`[TokenService] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TokenService] HTTP Error ${response.status}: ${errorText}`);
        return { data: null, error: `Token not found: ${response.status} ${response.statusText}` };
      }

      const result = await response.json();
      console.log(`[TokenService] Token data received:`, result);
      
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
    console.log('🚀 [TokenService] Début de getTopHolderPurchases pour:', tokenAddress);
    try {
      const url = getApiUrl(`/token_purchases/${tokenAddress}`);
      console.log(`📡 [TokenService] URL construite: ${url}`);
      
      console.log('⏳ [TokenService] Envoi de la requête...');
      const response = await fetch(url);
      console.log(`📥 [TokenService] Réponse reçue - Status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`❌ [TokenService] Erreur HTTP: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('📄 [TokenService] Contenu de l\'erreur:', errorText);
        return { data: [], error: `Failed to fetch transactions: ${response.status} ${response.statusText}` };
      }

      console.log('🔄 [TokenService] Parsing de la réponse JSON...');
      const result = await response.json();
      console.log('📦 [TokenService] Données reçues:', result);
      
      if (!result.success || !result.data) {
        console.warn('⚠️ [TokenService] Pas de données dans la réponse');
        return { data: [], error: 'No data returned from API' };
      }
      
      console.log(`✨ [TokenService] Formatage de ${result.data.length} transactions...`);
      console.log('✅ [TokenService] Données formatées avec succès');
      return { data: result.data };
    } catch (error) {
      console.error('💥 [TokenService] Erreur inattendue:', error);
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
    tx_hash
  }) {
    try {
      const imgUrl = token_image ? await uploadTokenImage(token_image) : null;

      const response = await fetch(getApiUrl('/addToken'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_address,
          token_name,
          token_symbol,
          supply: supply.toString(),
          liquidity: liquidity.toString(),
          max_wallet_percentage: Math.floor(parseFloat(max_wallet_percentage) * 10),
          network,
          deployer_address,
          image_url: imgUrl,
          is_featured: false,
          tx_hash
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to insert token');
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error in insertToken:', error);
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