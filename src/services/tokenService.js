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
    const { data: tokens, error } = await supabase
      .from('tokens')
      .select('*, token_address')
      .eq('network', network)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('TokenService - Error fetching tokens:', error);
      return [];
    }

    const uniqueTokens = tokens?.reduce((acc, current) => {
      const x = acc.find(item => item.token_address === current.token_address);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    return uniqueTokens || [];
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
        return null;
      }
      
      if (!data) {
        console.error('TokenService - No token found with address:', address);
        return null;
      }
      
      return {data};
    } catch (error) {
      console.error('TokenService - Error fetching token:', error);
      return null;
    }
  },

  // Update token price and market data
  async updateTokenMarketData(address, marketData) {
    try {
      const { data: tokenExists, error: checkError } = await supabase
        .from('tokens')
        .select('id')
        .eq('token_address', address)
        .single();
      
      if (checkError) {
        console.error('TokenService - Error checking token existence:', checkError);
        return null;
      }
      
      if (!tokenExists) {
        console.error('TokenService - Token not found with address:', address);
        return null;
      }
      
      const { data, error } = await supabase
        .from('tokens')
        .update({
          price: marketData.price || 0,
          market_cap: marketData.marketCap || 0,
          price_change_24h: marketData.priceChange24h || 0,
          volume_24h: marketData.volume24h || 0
        })
        .eq('token_address', address);
      
      if (error) {
        console.error('TokenService - Error updating token market data:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('TokenService - Error updating token market data:', error);
      return null;
    }
  },

  // Insert a new token
  async insertToken({
    token_address,
    liquidity,
    supply,
    network,
    deployer_address,
    max_wallet_percentage,
    token_name,
    token_symbol,
    token_image
  }) {
    try {
      const imgUrl = token_image ? await uploadTokenImage(token_image) : null;

      const { data, error } = await supabase
        .from('tokens')
        .insert([{
          token_address,
          liquidity,
          supply,
          network,
          deployer_address,
          created_at: new Date(),
          max_wallet_percentage,
          token_name,
          token_symbol,
          image_url: imgUrl
        }]);

      if (error) {
        console.error('Error inserting token:', error);
        throw error;
      }

      return { success: true, data };
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