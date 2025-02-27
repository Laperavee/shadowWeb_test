import { ethers } from 'ethers';
import { supabase } from '../lib/supabaseClient';

const SHADOW_ADDRESS = process.env.VITE_SHADOW_ADDRESS;
const SHADOW_ABI = [
  // Nous aurons besoin de l'ABI du contrat Shadow ici
  // Je vais utiliser une version simplifiée pour l'exemple
  "function deployToken(string name, string symbol, uint256 totalSupply, int24 tick, uint24 fee, bytes32 salt, address owner, string fid, address rewardAddress, uint256 maxWalletPercentage) external payable",
  "function generateSalt(address owner, string fid, string name, string symbol, uint256 totalSupply, uint256 maxWalletPercentage) external view returns (bytes32 salt, address token)"
];

export async function createToken(formData) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const chainId = await provider.getNetwork().then(network => network.chainId);
    
    // Déterminer le réseau
    let network = 'AVAX';
    if (chainId.toString() === '0x2105') {
      network = 'BASE';
    }
    
    // Convertir les valeurs en format approprié
    const totalSupplyWei = ethers.parseEther(formData.totalSupply);
    const maxWalletPercentage = Math.floor(parseFloat(formData.maxWalletPercentage) * 10);
    
    // Calcul du FID
    const timestamp = Math.floor(Date.now() / 1000);
    const symbolBinary = formData.symbol
      .split('')
      .map(char => char.charCodeAt(0).toString(2))
      .join('');
    const symbolBase10 = parseInt(symbolBinary, 2);
    const fid = Math.floor(timestamp * Math.PI * symbolBase10).toString();

    // Connexion au contrat Shadow
    const shadow = new ethers.Contract(SHADOW_ADDRESS, SHADOW_ABI, signer);

    // Générer le salt
    const saltResult = await shadow.generateSalt(
      userAddress,
      fid,
      formData.name,
      formData.symbol,
      totalSupplyWei,
      maxWalletPercentage
    );

    // Calcul du tick initial
    const price = parseFloat(formData.totalSupply) / parseFloat(formData.liquidity);
    const tickSpacing = 200;
    const sqrtPriceX96 = Math.sqrt(1/price) * Math.pow(2, 96);
    const initialTick = Math.floor(Math.log(sqrtPriceX96 / Math.pow(2, 96)) / Math.log(Math.sqrt(1.0001)));
    const validTick = Math.floor(initialTick / tickSpacing) * tickSpacing;

    // Déploiement du token
    const tx = await shadow.deployToken(
      formData.name,
      formData.symbol,
      totalSupplyWei,
      validTick,
      10000, // 1% fee
      saltResult.salt,
      userAddress,
      fid,
      userAddress,
      maxWalletPercentage,
      {
        value: ethers.parseEther(formData.deploymentFee || "0.001"),
        gasLimit: 10000000
      }
    );

    const receipt = await tx.wait();
    
    // Extraire l'adresse du token depuis les logs
    const tokenCreatedEvent = receipt.logs.find(log => {
      try {
        return log.topics[0] === ethers.id(
          "TokenCreated(address,uint256,address,string,string,uint256)"
        );
      } catch {
        return false;
      }
    });
    
    let tokenAddress;
    if (tokenCreatedEvent) {
      tokenAddress = tokenCreatedEvent.args ? 
        tokenCreatedEvent.args[0] : 
        `0x${tokenCreatedEvent.topics[1].slice(26)}`;
    }

    // Gérer l'upload de l'image si nécessaire
    let imageUrl = null;
    if (formData.tokenImage) {
      const { data, error } = await supabase.storage
        .from('token-images')
        .upload(`${tokenAddress}`, formData.tokenImage);
      
      if (!error) {
        imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/token-images/${tokenAddress}`;
      }
    }

    // Enregistrer le token dans Supabase
    try {
      const tokenData = {
        address: tokenAddress,
        name: formData.name,
        symbol: formData.symbol,
        network,
        creator: userAddress,
        total_supply: formData.totalSupply,
        initial_liquidity: formData.liquidity,
        max_wallet_percentage: parseFloat(formData.maxWalletPercentage),
        image_url: imageUrl,
        price: 0,
        market_cap: 0,
        price_change_24h: 0,
        volume_24h: 0,
        created_at: new Date().toISOString()
      };
      
      await tokenService.createToken(tokenData);
      
      // Ajouter la première transaction
      const transactionData = {
        token_address: tokenAddress,
        type: 'BUY',
        amount: formData.deploymentFee || "0.001",
        price: "0",
        tx_hash: tx.hash,
        timestamp: new Date().toISOString()
      };
      
      await tokenService.addTransaction(transactionData);
    } catch (dbError) {
      console.error("Error saving token to database:", dbError);
      // On continue même si l'enregistrement en DB échoue
    }

    return {
      success: true,
      transaction: tx.hash,
      tokenAddress
    };

  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
}

export const tokenService = {
  // Create a new token
  async createToken(tokenData) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .insert([tokenData]);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  },

  // Get all tokens with pagination
  async getTokens(page = 1, limit = 20, network = null) {
    try {
      let query = supabase
        .from('tokens')
        .select('*', { count: 'exact' });
      
      if (network) {
        query = query.eq('network', network);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) throw error;
      
      return {
        tokens: data.map(token => ({
          ...token,
          // Convertir les noms de champs snake_case en camelCase pour la compatibilité
          totalSupply: token.total_supply,
          initialLiquidity: token.initial_liquidity,
          maxWalletPercentage: token.max_wallet_percentage,
          imageUrl: token.image_url,
          priceChange24h: token.price_change_24h,
          volume24h: token.volume_24h,
          createdAt: token.created_at
        })),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }
  },

  // Get tokens by creator address
  async getTokensByCreator(creator) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('creator', creator)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(token => ({
        ...token,
        totalSupply: token.total_supply,
        initialLiquidity: token.initial_liquidity,
        maxWalletPercentage: token.max_wallet_percentage,
        imageUrl: token.image_url,
        priceChange24h: token.price_change_24h,
        volume24h: token.volume_24h,
        createdAt: token.created_at
      }));
    } catch (error) {
      console.error('Error fetching creator tokens:', error);
      throw error;
    }
  },

  // Get token by address
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

  // Add a new transaction
  async addTransaction(transaction) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction]);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  // Get recent transactions
  async getRecentTransactions(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          tokens:token_address (
            name,
            symbol
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data.map(tx => ({
        type: tx.type,
        amount: tx.amount,
        price: tx.price,
        txHash: tx.tx_hash,
        timestamp: tx.timestamp,
        tokenName: tx.tokens?.name || 'Unknown',
        tokenSymbol: tx.tokens?.symbol || 'UNKNOWN'
      }));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }
}; 