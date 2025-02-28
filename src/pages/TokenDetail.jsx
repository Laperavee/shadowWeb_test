import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tokenService } from '../services/tokenService';

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

  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('TokenDetail - Fetching token with address:', address);
        setLoading(true);
        setError(null);
        
        const datareturned = await tokenService.getTokenByAddress(address);
        const tokenData = datareturned.data;
        console.log('TokenDetail - Token data received:', tokenData);
        
        if (!tokenData) {
          console.error('TokenDetail - No token data found for address:', address);
          setError('Token not found');
          setLoading(false);
          return;
        }
        
        if (tokenData.network === 'AVAX') {
          tokenData.network = 'avalanche';
        }
        
        setToken(tokenData);
        fetchDexScreenerData(tokenData.token_address, tokenData.network);
      } catch (err) {
        console.error('TokenDetail - Error in fetchToken:', err);
        setError(err.message || 'Failed to load token data');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [address]);

  const fetchDexScreenerData = async (tokenAddress, network) => {
    try {
      console.log('TokenDetail - Fetching DexScreener data for:', tokenAddress);
      setDexLoading(true);
      
      setDexScreenerUrl(`https://dexscreener.com/${network}/${tokenAddress}?embed=1&theme=dark&trades=0&info=0`);
      
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      const data = await response.json();
      
      console.log('TokenDetail - DexScreener data received:', data);
      
      if (data && data.pairs && data.pairs.length > 0) {
        // Sort by volume to get the most active pair
        const sortedPairs = data.pairs.sort((a, b) => 
          parseFloat(b.volumeUsd24h || 0) - parseFloat(a.volumeUsd24h || 0)
        );
        
        const mainPair = sortedPairs[0];
        setDexData(mainPair);
        console.log('TokenDetail - Main trading pair:', mainPair);
        
        // Update token with market information
        if (mainPair) {
          const marketData = {
            price: parseFloat(mainPair.priceUsd || 0),
            marketCap: parseFloat(mainPair.marketCap || mainPair.fdv || 0),
            priceChange24h: parseFloat(mainPair.priceChange?.h24 || 0),
            volume24h: parseFloat(mainPair.volume?.h24 || 0),
            liquidity: parseFloat(mainPair.liquidity?.usd || 0) / 1000
          };

          console.log('TokenDetail - Previous token data:', token);
          const updatedToken = {
            ...token,
            market_data: marketData
          };
          console.log('TokenDetail - Updated token data:', updatedToken);
          
          setToken(updatedToken);
          
          // Update data in database
          try {
            console.log('TokenDetail - Updating token market data in database:', marketData);
            const result = await tokenService.updateTokenMarketData(tokenAddress, marketData);
            
            if (result === null) {
              console.log('TokenDetail - Token market data update skipped or failed, but continuing with UI update');
            } else {
              console.log('TokenDetail - Token market data updated in database successfully');
            }
          } catch (err) {
            console.error('TokenDetail - Failed to update token market data:', err);
            // Continue with UI update even if database update fails
          }
        }
      } else {
        console.log('TokenDetail - No trading pairs found on DexScreener');
      }
    } catch (err) {
      console.error('TokenDetail - Error fetching DexScreener data:', err);
    } finally {
      setDexLoading(false);
    }
  };

  // Update DexScreener URL when timeframe changes
  useEffect(() => {
    if (token && token.token_address) {
      const chainId = token.network === 'AVAX' ? 'avalanche' : 'base';
      const timeframeParam = timeframe === '24h' ? '1D' : timeframe === '7d' ? '1W' : '1M';
      setDexScreenerUrl(`https://dexscreener.com/${chainId}/${token.token_address}?embed=1&theme=dark&trades=0&info=0&interval=${timeframeParam}`);
    }
  }, [timeframe, token]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
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
      const network = token.network === 'AVAX' ? 'avalanche' : 'base';
      window.open(`https://dexscreener.com/${network}/${token.token_address}`, '_blank');
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
    <main className="min-h-screen bg-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0">
        <div className="grid-animation opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-fuchsia-900/20 to-cyan-900/30 animate-gradient-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,255,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            to="/shadow-fun" 
            className="inline-flex items-center text-fuchsia-400 hover:text-fuchsia-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to tokens
          </Link>
        </div>

        {/* Token header */}
        <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              {token.imageUrl ? (
                <img 
                  src={token.imageUrl} 
                  alt={token.token_name} 
                  className="w-16 h-16 rounded-full border border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-cyan-500/30 border border-gray-700 flex items-center justify-center">
                  <span className="text-2xl font-bold">{token.token_symbol?.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{token.token_name}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-fuchsia-400 font-bold">${token.token_symbol}</span>
                  <span className="text-gray-400 text-sm">
                    on {token.network}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-4 py-2 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 rounded-lg text-sm transition-colors"
              >
                <a 
                  href={`https://dexscreener.com/${token.network === 'AVAX' ? 'avalanche' : token.network}/${token.token_address}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View on DexScreener
                </a>
              </button>
              <a 
                href={`https://snowtrace.io/address/${token.token_address}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm transition-colors"
              >
                View on Explorer
              </a>
              <button 
                onClick={() => copyToClipboard(token.token_address)}
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <span>{copySuccess || 'Copy Address'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Price and variation */}
          <div className="mt-6 flex flex-wrap gap-6">
            <div>
              <p className="text-gray-400 text-sm">Price</p>
              <p className="text-2xl font-bold">{formatPrice(token.market_data?.price)}</p>
            </div>
            
            {token.market_data?.priceChange24h !== undefined && (
              <div>
                <p className="text-gray-400 text-sm">24h Change</p>
                <p className={`text-xl font-bold ${
                  parseFloat(token.market_data.priceChange24h) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(token.market_data.priceChange24h)}
                </p>
              </div>
            )}
            
            {token.market_data?.volume24h !== undefined && (
              <div>
                <p className="text-gray-400 text-sm">24h Volume</p>
                <p className="text-xl font-bold">${parseInt(token.market_data.volume24h || 0).toLocaleString()}</p>
              </div>
            )}
            
            {token.market_data?.marketCap !== undefined && (
              <div>
                <p className="text-gray-400 text-sm">Market Cap</p>
                <p className="text-xl font-bold">${parseInt(token.market_data.marketCap || 0).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Token stats and chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Token Info
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Price</span>
                <span className="font-bold">{formatPrice(token.market_data?.price)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Market Cap</span>
                <span className="font-bold">${parseInt(token.market_data?.marketCap || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Total Supply</span>
                <span className="font-bold">{parseInt(token.supply || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Initial Liquidity</span>
                <span className="font-bold">{token.liquidity} {token.network.toUpperCase() === 'AVALANCHE' ? 'AVAX' : 'ETH'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Max Wallet</span>
                <span className="font-bold">{token.max_wallet_percentage}%</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Creator</span>
                <a 
                  href={`https://snowtrace.io/address/${token.deployer_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-fuchsia-400 hover:text-fuchsia-300"
                >
                  {formatAddress(token.deployer_address)}
                </a>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Contract</span>
                <a 
                  href={`https://snowtrace.io/address/${token.token_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-fuchsia-400 hover:text-fuchsia-300"
                >
                  {formatAddress(token.token_address)}
                </a>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Created</span>
                <span className="font-bold">
                  {new Date(token.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="mt-6 space-y-2">
              <button
                onClick={openDexScreener}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all text-center"
              >
                Trade on DEX
              </button>
              
              <button
                onClick={() => copyToClipboard(token.token_address)}
                className="w-full py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all text-center"
              >
                {copySuccess || 'Copy Contract Address'}
              </button>
            </div>
          </div>
          
          {/* Chart - DexScreener Embed */}
          <div className="lg:col-span-2 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                Price Chart
              </h2>
              
              <div className="flex bg-gray-800/50 rounded-lg overflow-hidden">
                {['24h', '7d', '30d'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-3 py-1 text-sm ${
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
            
            <div className="h-[400px] w-full">
              {dexScreenerUrl ? (
                <iframe 
                  src={dexScreenerUrl}
                  title="DexScreener Chart"
                  className="w-full h-full border-0 rounded-lg"
                  allowFullScreen
                ></iframe>
              ) : dexLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500"></div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No chart data available for this token</p>
                </div>
              )}
            </div>
            
            {!dexData && !dexLoading && (
              <div className="text-center py-4 text-gray-400 text-sm">
                No trading data available yet. Check DexScreener for the latest information.
              </div>
            )}
          </div>
        </div>
        
        {/* Recent transactions */}
        <div className="mt-8 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
            Recent Transactions
          </h2>
          
          {token.transactions && token.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-800">
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {token.transactions.slice(0, 10).map((tx, index) => (
                    <tr key={index} className="border-b border-gray-800/50">
                      <td className={`py-3 ${
                        tx.type === 'BUY' ? 'text-green-400' : 
                        tx.type === 'SELL' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {tx.type}
                      </td>
                      <td className="py-3">{tx.amount}</td>
                      <td className="py-3">${tx.price}</td>
                      <td className="py-3 text-gray-400">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <a 
                          href={`https://snowtrace.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-fuchsia-400 hover:text-fuchsia-300"
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
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No transactions found</p>
              <a 
                href={`https://snowtrace.io/token/${token.token_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all text-sm"
              >
                View on Explorer
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default TokenDetail; 