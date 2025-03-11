import { supabase } from '../utils/supabase';
import avaxLogo from '../../dist/assets/avax_logo.png';

// En production, on utilise le chemin relatif pour les fonctions Netlify
const isProduction = import.meta.env.PROD;
const API_URL = isProduction ? '/.netlify/functions' : 'http://localhost:3002';

// Construire l'URL de l'API en fonction de l'environnement
const getApiUrl = (endpoint) => {
  if (isProduction) {
    // En production, on appelle directement la fonction tokens
    return `${API_URL}/tokens${endpoint}`;
  }
  // En développement, on garde le préfixe /api
  return `${API_URL}/api${endpoint}`;
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
        return [];
      }

      const { data: tokens } = await response.json();
      
      if (!tokens) {
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
      console.error('Error in getTokens:', error);
      return [];
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
      const response = await fetch(getApiUrl(`/tokens/address/${address}`));
      
      if (!response.ok) {
        return { data: null, error: 'Token not found' };
      }

      const { data } = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching token:', error);
      return { data: null, error };
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

      const response = await fetch(getApiUrl('/tokens'), {
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