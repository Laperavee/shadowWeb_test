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
      console.log(`[TokenService] Fetching tokens for network ${network} from ${url}`);
      
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
      // You might want to handle this error in your UI
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

  async getTopHolderPurchases(tokenAddress) {
    try {
      console.log(`📡 Récupération des achats pour le token ${tokenAddress}...`);
      // Construire l'URL en fonction de l'environnement
      const url = isProduction 
        ? `${API_URL}/transactions/${tokenAddress}`
        : `${API_URL}/api/transactions/${tokenAddress}`;
      console.log(`🔗 URL: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
        return { data: [], error: `Failed to fetch transactions: ${response.status} ${response.statusText}` };
      }

      const result = await response.json();
      console.log(`✅ ${result.data?.length || 0} transactions récupérées`);
      
      if (!result.success || !result.data) {
        return { data: [], error: 'No data returned from API' };
      }

      // Récupérer les informations du token
      const { data: token } = await this.getTokenByAddress(tokenAddress);
      
      // Formater les transactions pour l'affichage
      const formattedData = result.data.map(tx => ({
        type: tx.action ? 'BUY' : 'SELL',
        amount: tx.amount ? (parseFloat(tx.amount) / 1e18).toLocaleString() : '0',
        price: tx.cost ? `$${parseFloat(tx.cost).toFixed(2)}` : '$0.00',
        timestamp: new Date(tx.created_at),
        txHash: tx.tx_hash,
        user: tx.user_id,
        tokenSymbol: token?.token_symbol || 'UNKNOWN',
        tokenName: token?.token_name || 'Unknown Token'
      }));

      return { data: formattedData };
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
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