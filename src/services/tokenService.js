import { supabase } from '../utils/supabase';
import avaxLogo from '../../dist/assets/avax_logo.png';

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
    console.log('TokenService - Starting getTokens for network:', network);
    
    try {
      const response = await fetch(`http://localhost:3001/api/tokens?network=${network}`);
      
      if (!response.ok) {
        console.error('TokenService - Error fetching tokens:', await response.text());
        return [];
      }

      const { data: tokens } = await response.json();
      
      if (!tokens) {
        return [];
      }

      console.log('TokenService - Final results:', {
        totalCount: tokens.length,
        firstToken: tokens[0]
      });

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
      console.error('TokenService - Critical error in getTokens:', error);
      console.error('TokenService - Error stack:', error.stack);
      return [];
    }
  },

  // Get tokens by creator address
  async getTokensByCreator(creator) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select(`
          token_address,
          token_name,
          token_symbol,
          supply,
          liquidity,
          max_wallet_percentage,
          network,
          deployer_address,
          created_at
        `)
        .eq('deployer_address', creator)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching creator tokens:', error);
      throw error;
    }
  },

  async getTokenByAddress(address) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('token_address', address)
        .single();
      
      if (error) {
        console.error('TokenService - Error in getTokenByAddress:', error);
        return { data: null, error };
      }
      
      if (!data) {
        console.error('TokenService - No token found with address:', address);
        return { data: null, error: 'Token not found' };
      }
      
      return { data };
    } catch (error) {
      console.error('TokenService - Error fetching token:', error);
      return { data: null, error };
    }
  },

  // Insert a new token
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
      console.log('TokenService - Starting token insertion with data:', {
        token_address,
        token_name,
        token_symbol,
        supply,
        liquidity,
        max_wallet_percentage,
        network,
        deployer_address,
        tx_hash
      });

      const imgUrl = token_image ? await uploadTokenImage(token_image) : null;

      const response = await fetch('http://localhost:3001/api/tokens', {
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
          token_image: imgUrl,
          tx_hash
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to insert token');
      }

      const result = await response.json();
      console.log('TokenService - Successfully inserted token:', result.data);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('TokenService - Error in insertToken:', error);
      console.error('TokenService - Error stack:', error.stack);
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