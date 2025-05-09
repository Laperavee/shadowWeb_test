import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tokenService } from '../services/tokenService';
import { priceService } from '../services/priceService';
import { realtimeService } from '../services/realtimeService';
import { motion } from 'framer-motion';
import BackgroundEffects from '../components/BackgroundEffects';
import definedLogo from '../assets/defined_logo.png';
import dexscreenerLogo from '../assets/dexscreener_logo.png';

const TokenDetail = () => {
  const { address } = useParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [copySuccess, setCopySuccess] = useState('');
  const [definedData, setDefinedData] = useState(null);
  const [definedLoading, setDefinedLoading] = useState(false);
  const [definedLink, setDefinedLink] = useState('');
  const [holdersCount, setHoldersCount] = useState(null);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [topHolderPurchases, setTopHolderPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [newPurchaseIds, setNewPurchaseIds] = useState([]);
  const [newPurchasesCount, setNewPurchasesCount] = useState(0);
  const notificationSound = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimerRef = useRef(null);
  const [dexscreenerData, setDexscreenerData] = useState(null);
  const [dexscreenerLoading, setDexscreenerLoading] = useState(false);
  const [dexscreenerLink, setDexscreenerLink] = useState('');
  const [score, setScore] = useState(0);

  // Initialiser le son de notification
  useEffect(() => {
    notificationSound.current = new Audio('/notification.mp3');
  }, []);

  const fetchDefinedData = useCallback(async (tokenAddress, network) => {
    try {
      setDefinedLoading(true);
      
      const definedNetwork = network?.toUpperCase() === 'AVAX' ? 'avalanche' : network?.toLowerCase();
      setDefinedLink(`https://www.defined.fi/${definedNetwork}/${tokenAddress}`);
      
      const response = await fetch(`https://api.defined.fi/v1/tokens/${tokenAddress}`);
      const data = await response.json();
      
      if (data && data.pairs && data.pairs.length > 0) {
        const sortedPairs = data.pairs.sort((a, b) => 
          parseFloat(b.volumeUsd24h || 0) - parseFloat(a.volumeUsd24h || 0)
        );
        
        const mainPair = sortedPairs[0];
        setDefinedData(mainPair);
        
        if (mainPair) {
          const marketData = {
            price: parseFloat(mainPair.priceUsd || 0),
            marketCap: parseFloat(mainPair.fdv || 0),
            priceChange24h: parseFloat(mainPair.priceChange?.h24 || 0),
            volume24h: parseFloat(mainPair.volume?.h24 || 0),
            liquidity: parseFloat(mainPair.liquidity?.usd || 0) / 1000
          };

          setToken(prevToken => ({
            ...prevToken,
            market_data: marketData
          }));
        }
      }
    } catch (err) {
      // Silently handle error
    } finally {
      setDefinedLoading(false);
    }
  }, []);

  const fetchTopHolderPurchases = useCallback(async (tokenAddress) => {
    try {
      setPurchasesLoading(true);
      const { data, error } = await tokenService.getTopHolderPurchases(tokenAddress);      
      if (error) {
        console.error('[TopHolderPurchases] Error fetching purchases:', error);
      } else if (data) {
        setTopHolderPurchases(data || []);
      } else {
        setTopHolderPurchases([]);
      }
    } catch (err) {
      console.error('[TopHolderPurchases] Unexpected error:', err);
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  const fetchDexscreenerData = useCallback(async (tokenAddress, network) => {
    try {
      setDexscreenerLoading(true);
      
      const dexscreenerNetwork = network?.toUpperCase() === 'AVAX' ? 'avalanche' : network?.toLowerCase();
      setDexscreenerLink(`https://dexscreener.com/${dexscreenerNetwork}/${tokenAddress}`);
      
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      const data = await response.json();
      
      if (data && data.pairs && data.pairs.length > 0) {
        const sortedPairs = data.pairs.sort((a, b) => 
          parseFloat(b.volume.h24 || 0) - parseFloat(a.volume.h24 || 0)
        );
        
        const mainPair = sortedPairs[0];
        setDexscreenerData(mainPair);
        
        if (mainPair) {
          const marketData = {
            price: parseFloat(mainPair.priceUsd || 0),
            marketCap: parseFloat(mainPair.fdv || 0),
            priceChange24h: parseFloat(mainPair.priceChange.h24 || 0),
            volume24h: parseFloat(mainPair.volume.h24 || 0),
            liquidity: parseFloat(mainPair.liquidity.usd || 0)
          };

          setToken(prevToken => ({
            ...prevToken,
            market_data: marketData
          }));
        }
      }
    } catch (err) {
      console.error('Erreur during Dexscreener data fetching:', err);
    } finally {
      setDexscreenerLoading(false);
    }
  }, []);

  // Fonction pour rafraîchir manuellement les données
  const refreshData = useCallback(async () => {
    if (refreshing || !token) return;
    
    try {
      setRefreshing(true);      
      const result = await tokenService.getTokenByAddress(token.token_address);
      if (result && result.data) {
        setToken(prevToken => ({
          ...prevToken,
          ...result.data,
          market_data: prevToken.market_data
        }));
      }
      
      await Promise.all([
        fetchTopHolderPurchases(token.token_address),
        fetchDefinedData(token.token_address, token.network),
        fetchDexscreenerData(token.token_address, token.network)
      ]);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, refreshing, fetchTopHolderPurchases, fetchDefinedData, fetchDexscreenerData]);

  // Initial data load
  useEffect(() => {
    const loadTokenData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await tokenService.getTokenByAddress(address);
        
        if (!result || !result.data) {
          setError('Token not found');
          return;
        }
        
        const tokenData = result.data;
        if (tokenData.network === 'AVAX') {
          tokenData.network = 'avalanche';
        }
        
        setToken(tokenData);
        
        // Load all data in parallel
        await Promise.all([
          (async () => {
            const nativeSymbol = tokenData.network.toUpperCase() === 'AVALANCHE' ? 'AVAX' : 'ETH';
            const price = await priceService.getPrice(nativeSymbol);
            setTokenPrice(price);
          })(),
          fetchDefinedData(tokenData.token_address, tokenData.network),
          fetchDexscreenerData(tokenData.token_address, tokenData.network),
          fetchTopHolderPurchases(tokenData.token_address)
        ]);
        
      } catch (err) {
        setError(err.message || 'Failed to load token data');
      } finally {
        setLoading(false);
      }
    };

    loadTokenData();
    
    // Subscribe to price updates
    const unsubscribe = priceService.subscribeToUpdates((prices) => {
      if (token) {
        const nativeSymbol = token.network.toUpperCase() === 'AVALANCHE' ? 'AVAX' : 'ETH';
        setTokenPrice(prices[nativeSymbol] || 0);
      }
    });
    
    return () => unsubscribe();
  }, [address, fetchDefinedData, fetchDexscreenerData, fetchTopHolderPurchases]);

  // Subscribe to real-time purchases
  useEffect(() => {
    if (!token?.token_address) return;

    const unsubscribe = realtimeService.subscribeToTokenPurchases(
      token.token_address,
      async (payload) => {
        if (payload.eventType === 'INSERT') {
          const newPurchase = payload.new;
          
          setTopHolderPurchases(prevPurchases => {
            const exists = prevPurchases.some(p => p.tx_hash === newPurchase.tx_hash);
            if (exists) {
              return prevPurchases.map(p => 
                p.tx_hash === newPurchase.tx_hash ? newPurchase : p
              );
            }
            return [newPurchase, ...prevPurchases];
          });
          
          setNewPurchaseIds(prevIds => {
            if (!prevIds.includes(newPurchase.tx_hash)) {
              return [...prevIds, newPurchase.tx_hash];
            }
            return prevIds;
          });
          
          setNewPurchasesCount(count => count + 1);
          playNotificationSound();
          
          setTimeout(() => {
            setNewPurchaseIds(prevIds => 
              prevIds.filter(id => id !== newPurchase.tx_hash)
            );
          }, 5000);
        } else if (payload.eventType === 'UPDATE') {
          const updatedPurchase = payload.new;
          setTopHolderPurchases(prevPurchases => {
            return prevPurchases.map(purchase => 
              purchase.tx_hash === updatedPurchase.tx_hash ? updatedPurchase : purchase
            );
          });
        }
      }
    );
    
    return () => unsubscribe();
  }, [token]);

  // Update Defined URL when timeframe changes
  useEffect(() => {
    if (!token?.token_address) return;
    
    const timeframeParam = timeframe === '24h' ? '1m' : timeframe === '7d' ? '1W' : '1M';
    const definedNetwork = token.network?.toUpperCase() === 'AVAX' ? 'avalanche' : token.network?.toLowerCase();
    setDefinedLink(`https://www.defined.fi/${definedNetwork}/${token.token_address}?embedded=1&hideTxTable=1&hideSidebar=1&hideChart=0&hideChartEmptyBars=1&chartSmoothing=0&embedColorMode=DEFAULT&interval=${timeframeParam}&hideVolume=1`);
  }, [timeframe, token]);

  // Auto-refresh setup
  useEffect(() => {
    if (!token) return;
    
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    refreshTimerRef.current = setInterval(refreshData, 30000);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [token, refreshData]);

  // Mettre à jour le lien DexScreener quand le timeframe change
  useEffect(() => {
    if (!token?.token_address) return;
    
    const timeframeParam = timeframe === '24h' ? '1m' : timeframe === '7d' ? '1W' : '1M';
    const dexscreenerNetwork = token.network?.toUpperCase() === 'AVAX' ? 'avalanche' : token.network?.toLowerCase();
    setDexscreenerLink(`https://dexscreener.com/${dexscreenerNetwork}/${token.token_address}`);
  }, [timeframe, token]);

  // Calcul du score
  useEffect(() => {
    if (token) {
      let newScore = 0;
      if (token.twitter_handle && token.twitter_handle !== 'empty' && token.twitter_handle !== '@empty') {
        newScore += 60;
      }
      if (!token.is_fresh) {
        newScore += 40;
      }
      setScore(newScore);
    }
  }, [token]);

  // Fonction pour formater les adresses (afficher seulement le début et la fin)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied !');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const formatPrice = (price) => {
    if (!price) return '$0.000000';
    
    // For very small prices, use scientific notation
    if (price < 0.000001) {
      return '$' + price.toExponential(4);
    }
    
    // For small prices, show more decimals
    if (price < 0.01) {
      return '$' + price.toFixed(6);
    }
    
    // For normal prices
    return '$' + price.toFixed(4);
  };

  const formatPercentage = (value) => {
    if (!value) return '0%';
    const formattedValue = parseFloat(value).toFixed(2);
    const isPositive = parseFloat(value) >= 0;
    return `${isPositive ? '+' : ''}${formattedValue}%`;
  };

  // Function to open Defined
  const openDefined = () => {
    if (token && token.token_address) {
      window.open(`https://www.defined.fi/${token.network}/${token.token_address}`, '_blank');
    }
  };

  // Fonction pour ouvrir DexScreener
  const openDexscreener = () => {
    if (token && token.token_address) {
      window.open(`https://dexscreener.com/${token.network}/${token.token_address}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">
          {error || 'Token not found'}
        </h1>
        <p className="text-gray-400 mb-6">
          The token you're looking for might not exist or there was an error loading its data.
        </p>
        <Link to="/shadow-fun" className="text-fuchsia-400 hover:text-fuchsia-300">
          Return to tokens list
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-4 pt-24 relative"
    >
      <BackgroundEffects />
      
      <div className="relative z-10 max-w-7xl mx-auto">        
        {/* Rest of the content */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          {/* Token header with glass effect */}
          <div className="bg-gradient-to-r from-gray-900/50 via-black/30 to-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 mb-8 shadow-[0_0_25px_rgba(255,0,255,0.1)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                {token.imageUrl ? (
                  <img 
                    src={token.imageUrl} 
                    alt={token.token_name} 
                    className="w-20 h-20 rounded-2xl border-2 border-fuchsia-500/20 shadow-[0_0_15px_rgba(255,0,255,0.2)]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-cyan-500/30 border-2 border-fuchsia-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,0,255,0.2)]">
                    <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-fuchsia-400 to-cyan-400">
                      {token.token_symbol?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-fuchsia-200 to-white">
                      {token.token_name}
                    </h1>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                      <span className="text-sm font-medium text-gray-400">
                        Score: {score}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-sm font-medium">
                      ${token.token_symbol}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-800/50 text-gray-400 text-sm">
                      on {token.network}
                    </span>
                    {/* Twitter Status Indicator */}
                    <a 
                      href={token.twitter_handle && token.twitter_handle !== 'empty' && token.twitter_handle !== '@empty' 
                        ? `https://twitter.com/${token.twitter_handle.replace('@', '')}` 
                        : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                        token.twitter_handle && token.twitter_handle !== 'empty' && token.twitter_handle !== '@empty'
                          ? 'bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 cursor-pointer'
                          : 'bg-gray-800/50'
                      }`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        token.twitter_handle && token.twitter_handle !== 'empty' && token.twitter_handle !== '@empty'
                          ? 'bg-green-500 animate-pulse'
                          : 'bg-gray-500'
                      }`} />
                      <svg className={`w-4 h-4 ${
                        token.twitter_handle && token.twitter_handle !== 'empty' && token.twitter_handle !== '@empty'
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                    {/* Website Status Indicator */}
                    <a 
                      href={token.website_url && token.website_url !== 'empty' && token.website_url !== 'Created on X' ? token.website_url : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                        token.website_url && token.website_url !== 'empty' && token.website_url !== 'Created on X'
                          ? 'bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 cursor-pointer'
                          : 'bg-gray-800/50'
                      }`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        token.website_url && token.website_url !== 'empty' && token.website_url !== 'Created on X'
                          ? 'bg-green-500 animate-pulse'
                          : 'bg-gray-500'
                      }`} />
                      <svg className={`w-4 h-4 ${
                        token.website_url && token.website_url !== 'empty' && token.website_url !== 'Created on X'
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </a>
                    {/* Fresh Wallet Indicator */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                      !token?.is_fresh
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-gray-800/50'
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        !token?.is_fresh
                          ? 'bg-green-500 animate-pulse'
                          : 'bg-gray-500'
                      }`} />
                      <svg className={`w-4 h-4 ${
                        !token?.is_fresh
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={openDefined}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-black/40 hover:bg-fuchsia-500/10 border border-fuchsia-500/10 hover:border-fuchsia-500/30 transition-colors text-sm font-medium"
                    title="View on Defined"
                  >
                    <img src={definedLogo} alt="Defined" className="w-5 h-5" />
                    <span className="text-xs text-white font-semibold">Defined</span>
                  </button>
                  <button
                    onClick={openDexscreener}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-black/40 hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors text-sm font-medium"
                    title="View on Dexscreener"
                  >
                    <img src={dexscreenerLogo} alt="Dexscreener" className="w-5 h-5" />
                    <span className="text-xs text-white font-semibold">Dexscreener</span>
                  </button>
                  <a 
                    href={`https://${token.network === 'AVAX' ? 'snowtrace.io' : 'basescan.org'}/address/${token.token_address}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-700 hover:border-fuchsia-500/30 transition-all duration-300 text-sm font-medium group flex items-center gap-2"
                  >
                    <span>View on Explorer</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button 
                    onClick={() => copyToClipboard(token.token_address)}
                    className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-700 hover:border-fuchsia-500/30 transition-all duration-300 text-sm font-medium flex items-center gap-2"
                  >
                    <span>{copySuccess || 'Copy Address'}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Market stats with glass cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gray-900/50 to-black/30 backdrop-blur-xl rounded-xl border border-gray-800 p-4 hover:border-fuchsia-500/30 transition-all duration-300">
                <p className="text-gray-400 text-sm mb-1">Price</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
                  {formatPrice(token.market_data?.price)}
                </p>
              </div>
              
              {token.market_data?.priceChange24h !== undefined && (
                <div className="bg-gradient-to-br from-gray-900/50 to-black/30 backdrop-blur-xl rounded-xl border border-gray-800 p-4 hover:border-fuchsia-500/30 transition-all duration-300">
                  <p className="text-gray-400 text-sm mb-1">24h Change</p>
                  <p className={`text-2xl font-bold ${
                    parseFloat(token.market_data.priceChange24h) >= 0 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {formatPercentage(token.market_data.priceChange24h)}
                  </p>
                </div>
              )}
              
              {token.market_data?.volume24h !== undefined && (
                <div className="bg-gradient-to-br from-gray-900/50 to-black/30 backdrop-blur-xl rounded-xl border border-gray-800 p-4 hover:border-fuchsia-500/30 transition-all duration-300">
                  <p className="text-gray-400 text-sm mb-1">24h Volume</p>
                  <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
                    ${parseInt(token.market_data.volume24h || 0).toLocaleString()}
                  </p>
                </div>
              )}
              
              {token.market_data?.marketCap !== undefined && (
                <div className="bg-gradient-to-br from-gray-900/50 to-black/30 backdrop-blur-xl rounded-xl border border-gray-800 p-4 hover:border-fuchsia-500/30 transition-all duration-300">
                  <p className="text-gray-400 text-sm mb-1">Market Cap</p>
                  <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
                    {token.market_data.marketCap > 0 
                      ? `$${parseInt(token.market_data.marketCap).toLocaleString()}`
                      : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Token stats and chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats with improved styling */}
            <div className="bg-gradient-to-r from-gray-900/50 via-black/30 to-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:shadow-[0_0_25px_rgba(255,0,255,0.1)] transition-all duration-300">
              <h2 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                Token Info
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-800/50 group hover:border-fuchsia-500/20 transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Price</span>
                  <span className="font-bold group-hover:text-white transition-colors">
                    {formatPrice(token.market_data?.price)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-800/50 group hover:border-fuchsia-500/20 transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Market Cap</span>
                  <span className="font-bold group-hover:text-white transition-colors">
                    {token.market_data?.marketCap > 0 
                      ? `$${parseInt(token.market_data.marketCap).toLocaleString()}`
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-800/50 group hover:border-fuchsia-500/20 transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Total Supply</span>
                  <span className="font-bold group-hover:text-white transition-colors">
                    {parseInt(token.supply || 0).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-800/50 group hover:border-fuchsia-500/20 transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Initial Liquidity</span>
                  <span className="font-bold group-hover:text-white transition-colors">
                    {parseFloat(token.liquidity).toLocaleString()} {token.network === 'AVAX' ? 'AVAX' : 'ETH'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-800/50 group hover:border-fuchsia-500/20 transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Max Wallet</span>
                  <span className="font-bold group-hover:text-white transition-colors">
                    {token.max_wallet_percentage / 10}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-800/50 group hover:border-fuchsia-500/20 transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Creator</span>
                  <a 
                    href={`https://${token.network === 'AVAX' ? 'snowtrace.io' : 'basescan.org'}/address/${token.deployer_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                  >
                    {formatAddress(token.deployer_address)}
                  </a>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-800/50 group hover:border-fuchsia-500/20 transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Contract</span>
                  <a 
                    href={`https://${token.network === 'AVAX' ? 'snowtrace.io' : 'basescan.org'}/address/${token.token_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                  >
                    {formatAddress(token.token_address)}
                  </a>
                </div>
                
                <div className="flex justify-between items-center py-3 group">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Created</span>
                  <span className="font-bold group-hover:text-white transition-colors">
                    {new Date(token.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              {/* Action buttons with improved styling */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={openDefined}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all duration-300 group relative"
                >
                  <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-medium">
                    Trade on Defined
                  </span>
                </button>
                
                <button
                  onClick={() => copyToClipboard(token.token_address)}
                  className="w-full py-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-fuchsia-500/30 transition-all duration-300 text-gray-300 hover:text-white font-medium"
                >
                  {copySuccess || 'Copy Contract Address'}
                </button>
              </div>
            </div>
            
            {/* Chart with improved styling */}
            <div className="lg:col-span-2 bg-gradient-to-r from-gray-900/50 via-black/30 to-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:shadow-[0_0_25px_rgba(255,0,255,0.1)] transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                  Price Chart
                </h2>
                
                <div className="flex bg-gray-800/50 rounded-xl overflow-hidden p-1">
                  {['24h', '7d', '30d'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimeframe(period)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        timeframe === period 
                          ? 'bg-fuchsia-500/20 text-fuchsia-400' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-[90%] w-full rounded-xl border border-gray-800/50">
                {token?.token_address ? (
                  <iframe
                    className="w-full h-full border-0"
                    src={definedLink}
                    title="Token Chart"
                    style={{ transform: 'scale(1.02)' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-900/30">
                    <div className="text-center">
                      <p className="text-gray-400 mb-4">No chart data available for this token</p>
                      <button
                        onClick={() => window.open(definedLink, '_blank')}
                        className="px-4 py-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 text-sm hover:bg-fuchsia-500/30 transition-all duration-300"
                      >
                        Check on Defined
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Top Holder Purchases Section */}
          <div className="mt-8 bg-gradient-to-r from-gray-900/50 via-black/30 to-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:shadow-[0_0_25px_rgba(255,0,255,0.1)] transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                Top Holder Purchases
                {newPurchasesCount > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400">
                    +{newPurchasesCount} new
                  </span>
                )}
              </h2>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={refreshData}
                  disabled={refreshing}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    refreshing 
                      ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed' 
                      : 'bg-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500/30'
                  }`}
                >
                  <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                
                {newPurchasesCount > 0 && (
                  <button 
                    onClick={() => setNewPurchasesCount(0)}
                    className="text-sm text-gray-400 hover:text-fuchsia-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            {purchasesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fuchsia-500"></div>
              </div>
            ) : topHolderPurchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-800">
                      <th className="pb-4 font-medium">Holder</th>
                      <th className="pb-4 font-medium">Type</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Est. Value</th>
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topHolderPurchases.map((purchase, index) => (
                      <tr 
                        key={purchase.tx_hash || index} 
                        className={`border-b border-gray-800/50 hover:bg-gray-900/30 transition-all ${
                          newPurchaseIds.includes(purchase.tx_hash) 
                            ? 'bg-fuchsia-900/20 animate-pulse' 
                            : ''
                        }`}
                      >
                        <td className="py-4">
                          <div className="flex items-center">
                            <a 
                              href={`https://${token.network === 'AVAX' ? 'snowtrace.io' : 'basescan.org'}/address/${purchase.user_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                            >
                              {`${purchase.user_id.substring(0, 4)}...${purchase.user_id.substring(purchase.user_id.length - 3)}`}
                            </a>
                          </div>
                        </td>
                        <td className="py-4 font-medium">
                          <span className={`px-3 py-1 rounded-full ${
                            purchase.action === 'SELL'
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
                              : 'bg-green-500/10 border border-green-500/30 text-green-400'
                          } text-sm`}>
                            {purchase.action}
                          </span>
                        </td>
                        <td className="py-4 font-medium">
                          {purchase.amount}
                        </td>
                        <td className="py-4 font-medium">
                          {purchase.cost}
                        </td>
                        <td className="py-4 text-gray-400">
                          {purchase.date}
                        </td>
                        <td className="py-4">
                          <a 
                            href={`https://${token.network === 'AVAX' ? 'snowtrace.io' : 'basescan.org'}/tx/${purchase.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-2 group"
                          >
                            <span>{`${purchase.tx_hash.substring(0, 4)}...${purchase.tx_hash.substring(purchase.tx_hash.length - 3)}`}</span>
                            <svg className="w-4 h-4 text-fuchsia-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800/50">
                <p className="text-gray-400 mb-2">No top holder purchases detected yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  When top holders purchase this token, their transactions will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TokenDetail; 