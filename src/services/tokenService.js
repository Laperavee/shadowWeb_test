import { supabase, authenticateSystemUser } from '../utils/supabase';

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
};

async function insertData(table, data) {
  const session = await authenticateSystemUser();
  if (!session) return;

  const { error } = await supabase
    .from(table)
    .insert(data, { returning: "minimal" });

  if (error) {
    console.error("Insertion failed:", error.message);
    throw error;
  } else {
    console.log("Data inserted successfully");
  }
}

export const tokenService = {
  // Get all tokens with pagination
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

    // Dédupliquer les tokens par token_address
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
        .eq('address', address)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        totalSupply: data.total_supply,
        initialLiquidity: data.initial_liquidity,
        maxWalletPercentage: data.max_wallet_percentage,
        imageUrl: data.image_url,
        priceChange24h: data.price_change_24h,
        volume24h: data.volume_24h,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error fetching token:', error);
      throw error;
    }
  },

  // Update token price and market data
  async updateTokenMarketData(address, marketData) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .update({
          price: marketData.price,
          market_cap: marketData.marketCap,
          price_change_24h: marketData.priceChange24h,
          volume_24h: marketData.volume24h
        })
        .eq('address', address);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating token market data:', error);
      throw error;
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
    token_symbol
  }) {
    try {
      await insertData('tokens', {
        token_address,
        liquidity,
        supply,
        network,
        deployer_address,
        created_at: new Date().toISOString(),
        max_wallet_percentage,
        token_name,
        token_symbol
      });

      return { success: true };
    } catch (error) {
      console.error('Error in insertToken:', error);
      throw error;
    }
  },

  // Test function to add a sample token
  async addTestToken() {
    return this.insertToken({
      token_address: '0x1234567890123456789012345678901234567890',
      token_name: 'Test Token',
      token_symbol: 'TEST',
      supply: 1000000,
      liquidity: 1000,
      max_wallet_percentage: 5,
      network: 'AVAX',
      deployer_address: '0x0000000000000000000000000000000000000000'
    });
  }
}; 