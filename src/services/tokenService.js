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

    console.log('Image uploaded successfully, URL:', signedUrl);
    return signedUrl;
  } catch (error) {
    console.error('Error in uploadTokenImage:', error);
    return null;
  }
}

export const tokenService = {
  async getTokens(network) {
    console.log('TokenService - getTokens called with network:', network);
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

    console.log('TokenService - Fetched unique tokens:', uniqueTokens);
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
      
      // If no data is found, return null
      if (!data) {
        console.error('TokenService - No token found with address:', address);
        return null;
      }
      
      console.log('TokenService - Token data retrieved:', data);
      
      return {
        ...data,
        // Default values for market data
        price: data.price || 0.000001,
        marketCap: data.market_cap || (data.supply * 0.000001),
        priceChange24h: data.price_change_24h || 0,
        volume24h: data.volume_24h || 0,
        transactions: []
      };
    } catch (error) {
      console.error('TokenService - Error fetching token:', error);
      return null;
    }
  },

  // Update token price and market data
  async updateTokenMarketData(address, marketData) {
    try {
      console.log('TokenService - updateTokenMarketData called with address:', address);
      console.log('TokenService - Market data to update:', marketData);
      
      // First check if the token exists
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
      
      // Now update the token
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
      
      console.log('TokenService - Token market data updated successfully');
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

      console.log('Token inserted successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error in insertToken:', error);
      throw error;
    }
  },

  async addTestToken() {
    try {
      // Convertir l'image AVAX en Blob puis en File
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

      console.log('Inserting test token with data:', tokenData);
      const result = await this.insertToken(tokenData);
      console.log('Test token insertion result:', result);
      return result;
    } catch (error) {
      console.error('Error in addTestToken:', error);
      throw error;
    }
  }
}; 