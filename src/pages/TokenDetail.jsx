import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tokenService } from '../services/tokenService';
import { priceService } from '../services/priceService';
import { realtimeService } from '../services/realtimeService';

const TokenDetail = () => {
  const { address } = useParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [copySuccess, setCopySuccess] = useState('');
  const [dexData, setDexData] = useState(null);
  const [dexLoading, setDexLoading] = useState(false);
  const [dexScreenerUrl, setDexScreenerUrl] = useState('');
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

  // Initialiser le son de notification
  useEffect(() => {
    notificationSound.current = new Audio('/notification.mp3');
  }, []);

  // Fonction pour jouer le son de notification
  const playNotificationSound = () => {
    if (notificationSound.current) {
      notificationSound.current.play().catch(e => {
        // Ignorer les erreurs de lecture (souvent dues aux restrictions du navigateur)
        console.log('Notification sound could not be played:', e);
      });
    }
  };

  // Fonction pour formater les adresses (afficher seulement le début et la fin)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(null);        
        const result = await tokenService.getTokenByAddress(address);
        
        if (!result || !result.data) {
          setError('Token not found');
          setLoading(false);
          return;
        }
        
        const tokenData = result.data;
        if (tokenData.network === 'AVAX') {
          tokenData.network = 'avalanche';
        }
        
        setToken(tokenData);
        fetchDexScreenerData(tokenData.token_address, tokenData.network);
        fetchTopHolderPurchases(tokenData.token_address);
        
        // Récupérer le prix du token natif (AVAX ou ETH)
        const nativeSymbol = tokenData.network.toUpperCase() === 'AVALANCHE' ? 'AVAX' : 'ETH';
        const price = await priceService.getPrice(nativeSymbol);
        setTokenPrice(price);
      } catch (err) {
        setError(err.message || 'Failed to load token data');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
    
    // S'abonner aux mises à jour de prix
    const unsubscribe = priceService.subscribeToUpdates((prices) => {
      if (token) {
        const nativeSymbol = token.network.toUpperCase() === 'AVALANCHE' ? 'AVAX' : 'ETH';
        setTokenPrice(prices[nativeSymbol] || 0);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [address]);

  const fetchDexScreenerData = async (tokenAddress, network) => {
    try {
      setDexLoading(true);
      
      const dexNetwork = network?.toUpperCase() === 'AVAX' ? 'avalanche' : network?.toLowerCase();
      setDexScreenerUrl(`https://dexscreener.com/${dexNetwork}/${tokenAddress}?embed=1&theme=dark&trades=0&info=0`);
      
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      const data = await response.json();
      
      if (data && data.pairs && data.pairs.length > 0) {
        // Sort by volume to get the most active pair
        const sortedPairs = data.pairs.sort((a, b) => 
          parseFloat(b.volumeUsd24h || 0) - parseFloat(a.volumeUsd24h || 0)
        );
        
        const mainPair = sortedPairs[0];
        setDexData(mainPair);
        
        // Update token with market information
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
      setDexLoading(false);
    }
  };

  const fetchTopHolderPurchases = async (tokenAddress) => {
    console.log('🔍 [TopHolderPurchases] Début de la récupération des achats pour:', tokenAddress);
    try {
      setPurchasesLoading(true);
      console.log('⏳ [TopHolderPurchases] État de chargement activé');

      console.log('📡 [TopHolderPurchases] Appel du service tokenService.getTopHolderPurchases');
      const { data, error } = await tokenService.getTopHolderPurchases(tokenAddress);
      
      console.log('📦 [TopHolderPurchases] Réponse reçue:', { data, error });
      
      if (error) {
        console.error('❌ [TopHolderPurchases] Erreur lors de la récupération:', error);
      } else if (data) {
        console.log(`✅ [TopHolderPurchases] ${data.length} achats récupérés avec succès`);
        setTopHolderPurchases(data || []);
      } else {
        console.log('ℹ️ [TopHolderPurchases] Aucun achat trouvé');
        setTopHolderPurchases([]);
      }
    } catch (err) {
      console.error('💥 [TopHolderPurchases] Erreur inattendue:', err);
    } finally {
      console.log('🏁 [TopHolderPurchases] Fin du processus de récupération');
      setPurchasesLoading(false);
    }
  };

  // S'abonner aux achats des top holders en temps réel
  useEffect(() => {
    if (token && token.token_address) {
      // S'abonner aux nouveaux achats
      const unsubscribe = realtimeService.subscribeToTokenPurchases(
        token.token_address,
        async (payload) => {
          // Vérifier si c'est un nouvel achat ou une mise à jour
          if (payload.eventType === 'INSERT') {
            const newPurchase = payload.new;
            
            // Si le prix du token est disponible et que le coût n'est pas défini, le calculer et mettre à jour la base de données
            if (token.market_data?.price && !newPurchase.cost) {
              try {
                const tokenAmount = parseFloat(newPurchase.amount) / 1e18;
                const cost = tokenAmount * token.market_data.price;
                
                // Mettre à jour la colonne cost dans la base de données
                const response = await fetch(`/api/token-purchases/${newPurchase.id}/update-cost`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    cost: cost.toString()
                  }),
                });
                
                if (response.ok) {
                  newPurchase.cost = cost.toString();
                }
              } catch (error) {
                console.error('❌ Erreur lors de la mise à jour du coût:', error);
              }
            }
            
            // Ajouter le nouvel achat à la liste et mettre à jour l'interface
            setTopHolderPurchases(prevPurchases => {
              // Vérifier si l'achat existe déjà dans la liste
              const exists = prevPurchases.some(p => p.tx_hash === newPurchase.tx_hash);
              if (exists) {
                return prevPurchases.map(p => 
                  p.tx_hash === newPurchase.tx_hash ? newPurchase : p
                );
              } else {
                return [newPurchase, ...prevPurchases];
              }
            });
            
            // Mettre à jour les IDs des nouvelles transactions pour l'animation
            setNewPurchaseIds(prevIds => {
              if (!prevIds.includes(newPurchase.tx_hash)) {
                return [...prevIds, newPurchase.tx_hash];
              }
              return prevIds;
            });
            
            // Incrémenter le compteur de nouvelles transactions
            setNewPurchasesCount(count => count + 1);
            
            // Jouer le son de notification
            playNotificationSound();
            
            // Supprimer l'ID de la liste des nouvelles transactions après 5 secondes
            setTimeout(() => {
              setNewPurchaseIds(prevIds => prevIds.filter(id => id !== newPurchase.tx_hash));
            }, 5000);
          } else if (payload.eventType === 'UPDATE') {
            const updatedPurchase = payload.new;
            
            // Mettre à jour l'achat dans la liste
            setTopHolderPurchases(prevPurchases => {
              return prevPurchases.map(purchase => 
                purchase.id === updatedPurchase.id ? updatedPurchase : purchase
              );
            });
          }
        }
      );
      
      // Se désabonner quand le composant est démonté ou quand l'adresse du token change
      return () => {
        unsubscribe();
      };
    }
  }, [token]);

  // Update DexScreener URL when timeframe changes
  useEffect(() => {
    if (token && token.token_address) {
      const timeframeParam = timeframe === '24h' ? '1m' : timeframe === '7d' ? '1W' : '1M';
      const dexNetwork = token.network?.toUpperCase() === 'AVAX' ? 'avalanche' : token.network?.toLowerCase();
      setDexScreenerUrl(`https://dexscreener.com/${dexNetwork}/${token.token_address}?embed=1&theme=dark&trades=0&info=0&interval=${timeframeParam}`);
    }
  }, [timeframe, token]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied!');
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

  // Function to open DexScreener
  const openDexScreener = () => {
    if (token && token.token_address) {
      window.open(`https://dexscreener.com/${token.network}/${token.token_address}`, '_blank');
    }
  };

  // Fonction pour rafraîchir manuellement les données
  const refreshData = useCallback(async () => {
    if (refreshing || !token) return;
    
    try {
      setRefreshing(true);
      console.log('🔄 Rafraîchissement manuel des données...');
      
      // Rafraîchir les données du token
      const result = await tokenService.getTokenByAddress(token.token_address);
      if (result && result.data) {
        setToken(prevToken => ({
          ...prevToken,
          ...result.data,
          market_data: prevToken.market_data // Conserver les données de marché
        }));
      }
      
      // Rafraîchir les achats des top holders
      await fetchTopHolderPurchases(token.token_address);
      
      // Rafraîchir les données de marché
      await fetchDexScreenerData(token.token_address, token.network);
      
      console.log('✅ Données rafraîchies avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement des données:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, refreshing]);

  // Configurer le rafraîchissement automatique
  useEffect(() => {
    if (token) {
      // Nettoyer tout timer existant
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      // Configurer un nouveau timer pour rafraîchir les données toutes les 30 secondes
      refreshTimerRef.current = setInterval(() => {
        console.log('⏱️ Rafraîchissement automatique des données...');
        refreshData();
      }, 30000); // 30 secondes
      
      // Nettoyer le timer lors du démontage du composant
      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [token, refreshData]);

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
    <main className="min-h-screen bg-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0">
        <div className="grid-animation opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-fuchsia-900/20 to-cyan-900/30 animate-gradient-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.8),transparent_50%,rgba(0,0,0,0.8))]" />
      </div>

      <div className="relative z-10">
        {/* Header with blur effect */}
        <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-fuchsia-500/20 mb-8">
          <div className="container mx-auto px-6 py-4">
            <Link 
              to="/shadow-fun" 
              className="inline-flex items-center text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to tokens
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
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
                  <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-fuchsia-200 to-white">
                    {token.token_name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 font-semibold">
                      ${token.token_symbol}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-800/50 text-gray-400 text-sm">
                      on {token.network}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={openDexScreener}
                  className="px-4 py-2 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 rounded-xl border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all duration-300 text-sm font-medium group flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,0,255,0.3)]"
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                    View on DexScreener
                  </span>
                  <svg className="w-4 h-4 text-fuchsia-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                
                <a 
                  href={`https://snowtrace.io/address/${token.token_address}`} 
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
                    ${parseInt(token.market_data.marketCap || 0).toLocaleString()}
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
                    ${parseInt(token.market_data?.marketCap || 0).toLocaleString()}
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
                    {parseFloat(token.liquidity).toLocaleString()} AVAX
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-800/50 group hover:border-fuchsia-500/20 transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Max Wallet</span>
                  <span className="font-bold group-hover:text-white transition-colors">
                    {token.max_wallet_percentage}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-800/50 group hover:border-fuchsia-500/20 transition-colors">
                  <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Creator</span>
                  <a 
                    href={`https://snowtrace.io/address/${token.deployer_address}`}
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
                    href={`https://snowtrace.io/address/${token.token_address}`}
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
                  onClick={openDexScreener}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 transform group-hover:translate-x-full transition-transform duration-500"></div>
                  <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-medium">
                    Trade on DEX
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
              
              <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-800/50">
                {dexScreenerUrl ? (
                  <iframe 
                    src={dexScreenerUrl}
                    title="DexScreener Chart"
                    className="w-full h-full border-0"
                    allowFullScreen
                  ></iframe>
                ) : dexLoading ? (
                  <div className="flex items-center justify-center h-full bg-gray-900/30">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-fuchsia-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-900/30">
                    <div className="text-center">
                      <p className="text-gray-400 mb-4">No chart data available for this token</p>
                      <button
                        onClick={openDexScreener}
                        className="px-4 py-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 text-sm hover:bg-fuchsia-500/30 transition-all duration-300"
                      >
                        Check on DexScreener
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Recent transactions with improved styling */}
          <div className="mt-8 bg-gradient-to-r from-gray-900/50 via-black/30 to-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:shadow-[0_0_25px_rgba(255,0,255,0.1)] transition-all duration-300">
            <h2 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Recent Transactions
            </h2>
            
            {token.transactions && token.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-800">
                      <th className="pb-4 font-medium">Type</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Price</th>
                      <th className="pb-4 font-medium">Time</th>
                      <th className="pb-4 font-medium">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {token.transactions.slice(0, 10).map((tx, index) => (
                      <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                        <td className={`py-4 ${
                          tx.type === 'BUY' ? 'text-green-400' : 
                          tx.type === 'SELL' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            tx.type === 'BUY' 
                              ? 'bg-green-500/10 border border-green-500/30' 
                              : 'bg-red-500/10 border border-red-500/30'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 font-medium">{tx.amount}</td>
                        <td className="py-4 font-medium">${tx.price}</td>
                        <td className="py-4 text-gray-400">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4">
                          <a 
                            href={`https://snowtrace.io/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                          >
                            {formatAddress(tx.txHash)}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800/50">
                <p className="text-gray-400 mb-4">No transactions found</p>
                <a 
                  href={`https://snowtrace.io/token/${token.token_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all duration-300 text-sm font-medium"
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                    View on Explorer
                  </span>
                </a>
              </div>
            )}
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
                  {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
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
                        key={purchase.id || purchase.tx_hash || index} 
                        className={`border-b border-gray-800/50 hover:bg-gray-900/30 transition-all ${
                          newPurchaseIds.includes(purchase.tx_hash) 
                            ? 'bg-fuchsia-900/20 animate-pulse' 
                            : ''
                        }`}
                      >
                        <td className="py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-white">
                                {formatAddress(purchase.user_id)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Top Holder
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-medium">
                          <span className={`px-3 py-1 rounded-full ${
                            purchase.action === false 
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
                              : 'bg-green-500/10 border border-green-500/30 text-green-400'
                          } text-sm`}>
                            {purchase.action === false ? 'SELL' : 'BUY'}
                          </span>
                        </td>
                        <td className="py-4 font-medium">
                          <span className={`${
                            purchase.action === false 
                              ? 'text-red-400' 
                              : 'text-green-400'
                          }`}>
                            {purchase.amount} tokens
                          </span>
                        </td>
                        <td className="py-4 font-medium">
                          {purchase.cost ? (
                            <span className="text-gray-300">
                              ${purchase.cost}
                            </span>
                          ) : token.market_data?.price ? (
                            <span className="text-gray-300">
                              ${(purchase.amount * token.market_data.price).toString()}
                              <span className="text-xs text-gray-500 block">(estimation)</span>
                            </span>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="py-4 text-gray-400">
                          {purchase.date}
                        </td>
                        <td className="py-4">
                          <a 
                            href={`https://snowtrace.io/tx/${purchase.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center"
                          >
                            {formatAddress(purchase.tx_hash)}
                            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    </main>
  );
};

export default TokenDetail; 