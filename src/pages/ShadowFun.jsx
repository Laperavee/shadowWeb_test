import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ShadowArtifact from '../artifact/Shadow.json';
import avaxLogo from '../../dist/assets/avax_logo.png';
import baseLogo from '../../dist/assets/base_logo.png';
import { CONTRACTS } from '../config/contracts';
import { tokenService } from '../services/tokenService';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';

const SHADOW_ABI = ShadowArtifact.abi;

const NETWORKS = {
  AVAX: {
    chainId: "0xa86a",
    chainName: "Avalanche",
    logo: avaxLogo,
    disabled: false,
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18
    },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"]
  },
  BASE: {
    chainId: "0x2105",
    chainName: "Base",
    logo: baseLogo,
    disabled: true,
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"]
  }
};

const NETWORK_LIMITS = {
  AVAX: {
    minLiquidity: 100,
    maxLiquidity: 90000,
    minSupply: 1,
    maxSupply: 1000000000,
    minWalletPercentage: 0.1,
    maxWalletPercentage: 10,
    minDeploymentFee: 0.00001,
    currency: 'AVAX'
  },
  BASE: {
    minLiquidity: 10,
    maxLiquidity: 1000,
    minSupply: 1,
    maxSupply: 1000000000,
    minWalletPercentage: 0.1,
    maxWalletPercentage: 10,
    minDeploymentFee: 0.00001,
    currency: 'ETH'
  }
};

const switchNetwork = async (chainId) => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const targetNetwork = NETWORKS[chainId];
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }]
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORKS[chainId]]
          });
        } catch (addError) {
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }
};

const NetworkSelector = ({ selectedChain, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNetworkChange = async (newChain) => {
    if (NETWORKS[newChain].disabled) return;
    try {
      if (window.ethereum && window.ethereum.selectedAddress) {
        await switchNetwork(newChain);
      }
      onChange(newChain);
      setIsOpen(false);
    } catch (error) {
      addNotification(`Failed to switch to ${NETWORKS[newChain].chainName}. Please try again.`, "error");
    }
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-20 h-10 px-3 gap-3 rounded-lg bg-black border border-gray-800 cursor-pointer hover:border-fuchsia-500/50"
      >
        <img
          src={NETWORKS[selectedChain].logo}
          alt={NETWORKS[selectedChain].chainName}
          className="w-6 h-6"
        />
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-20 bg-black border border-gray-800 rounded-lg overflow-hidden z-50">
          {Object.entries(NETWORKS).map(([key, network]) => (
            <div
              key={key}
              onClick={() => !network.disabled && handleNetworkChange(key)}
              className={`relative flex items-center justify-center h-10 ${
                network.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:bg-gray-900'
              } ${selectedChain === key ? 'bg-gray-900' : ''}`}
            >
              <img
                src={network.logo}
                alt={network.chainName}
                className="w-6 h-6"
              />
              {network.disabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-xs font-bold text-white">SOON</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getLiquidityLabel = (chain) => {
  const { minLiquidity, maxLiquidity, currency } = NETWORK_LIMITS[chain];
  return `Initial Liquidity (${currency})`;
};

const getLiquidityPlaceholder = (chain) => {
  const { minLiquidity, maxLiquidity, currency } = NETWORK_LIMITS[chain];
  return `${formatNumber(minLiquidity)} to ${formatNumber(maxLiquidity)} ${currency}`;
};

const validateInput = (value, min, max, isInteger = false) => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  if (isInteger && !Number.isInteger(numValue)) return false;
  return numValue >= min && numValue <= max;
};

const validateText = (value, field) => {
  const patterns = {
    name: /^[a-zA-Z0-9\s]{1,50}$/,
    symbol: /^[a-zA-Z0-9]{1,10}$/
  };
  return patterns[field].test(value);
};

const getErrorMessage = (field, chain) => {
  const limits = NETWORK_LIMITS[chain];
  switch (field) {
    case 'liquidity':
      return `Liquidity must be between ${limits.minLiquidity} and ${limits.maxLiquidity} ${limits.currency}`;
    case 'totalSupply':
      return `Total supply must be between ${limits.minSupply} and ${limits.maxSupply/10**9} Billion`;
    case 'maxWalletPercentage':
      return `Max wallet percentage must be between ${limits.minWalletPercentage}% and ${limits.maxWalletPercentage}%`;
    default:
      return 'Invalid input';
  }
};

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
};

export default function ShadowFun() {
  const [activeTab, setActiveTab] = useState('tokens');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    liquidity: '',
    maxWalletPercentage: '',
    deploymentFee: '0.00001',
    fullAccess: false
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState('');

  const [selectedChain, setSelectedChain] = useState('AVAX');

  const [notifications, setNotifications] = useState([]);

  const [tokenPrices, setTokenPrices] = useState({
    AVAX: 0,
    ETH: 0
  });

  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
  
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        const targetNetwork = NETWORKS[selectedChain];
        
        if (chainId !== targetNetwork.chainId) {  
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetNetwork.chainId }]
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [targetNetwork]
              });
            } else {
              throw switchError;
            }
          }
        }
        setIsWalletConnected(true);
      } catch (error) {
        addNotification(`Please make sure you're connected to ${NETWORKS[selectedChain].chainName}`, "error");
      }
    } else {
      addNotification("MetaMask is not installed!", "error");
    }
  };

  useEffect(() => {
    const updateContracts = async () => {
      if (window.ethereum && isWalletConnected) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const shadowAddress = CONTRACTS[selectedChain].SHADOW_ADDRESS;
        const shadowTokenAddress = CONTRACTS[selectedChain].SHADOW_TOKEN_ADDRESS;
        
        const shadow = new ethers.Contract(
          shadowAddress,
          SHADOW_ABI,
          signer
        );
        
        setShadowContract(shadow);
      }
    };

    updateContracts();
  }, [selectedChain, isWalletConnected]);

  useEffect(() => {
    const fetchTokenPrices = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2,ethereum&vs_currencies=usd');
        const data = await response.json();
        setTokenPrices({
          AVAX: data['avalanche-2'].usd,
          ETH: data.ethereum.usd
        });
      } catch (error) {
        console.error('Failed to fetch token prices:', error);
      }
    };

    fetchTokenPrices();
    const interval = setInterval(fetchTokenPrices, 60000); 

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadTokens() {
      try {
        console.log('ShadowFun - Loading tokens for network:', selectedChain);
        setIsLoading(true);
        const tokens = await tokenService.getTokens(selectedChain);
        console.log('ShadowFun - Received tokens:', tokens);
        if (Array.isArray(tokens)) {
          setTokens(tokens);
        }
      } catch (error) {
        console.error('ShadowFun - Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTokens();
  }, [selectedChain]);

  const handleCreateToken = async (e) => {
    e.preventDefault();
    
    const { SHADOW_ADDRESS, SHADOW_TOKEN_ADDRESS } = CONTRACTS[selectedChain];
    
    if (!SHADOW_ADDRESS || !SHADOW_TOKEN_ADDRESS) {
      addNotification("Contract addresses not configured for this network", "error");
      return;
    }

    if (!isWalletConnected) {
      addNotification("Please connect your wallet first!", "error");
      return;
    }

    if (!formData.name || !formData.symbol || !formData.totalSupply || !formData.liquidity || !formData.maxWalletPercentage) {
      addNotification("Please fill all fields", "error");
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('Initializing deployment...');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    const network = await provider.getNetwork();

    try {
      const shadow = new ethers.Contract(
        SHADOW_ADDRESS,
        SHADOW_ABI,
        signer
      );
    
      const maxWalletPercentage = parseFloat(formData.maxWalletPercentage)*10;

      setDeploymentStatus('Generating salt...');
      try {        
        const result = await shadow.generateSalt.staticCall(
          userAddress, 
          formData.name,
          formData.symbol,
          BigInt(ethers.parseEther(formData.totalSupply)),
          maxWalletPercentage
        );

        const [salt, predictedAddress] = result;

        setDeploymentStatus('Deploying token...');
        const tx = await shadow.deployToken(
          formData.name,
          formData.symbol,
          BigInt(ethers.parseEther(formData.totalSupply)),
          ethers.parseUnits(formData.liquidity),
          10000,
          salt,
          userAddress,
          parseInt(maxWalletPercentage),
          {
            value: ethers.parseEther(formData.deploymentFee),
            gasLimit: 8000000
          }
        );

        setDeploymentStatus('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        
        const tokenCreatedEvent = receipt.logs.find(log => {
          try {
            return log.topics[0] === ethers.id(
              "TokenCreated(address,uint256,address,string,string,uint256)"
            );
          } catch {
            return false;
          }
        });

        if (tokenCreatedEvent) {
          const tokenAddress = tokenCreatedEvent.args ? 
            tokenCreatedEvent.args[0] : 
            `0x${tokenCreatedEvent.topics[1].slice(26)}`;
          
          setDeploymentStatus(`Token deployed successfully at ${tokenAddress}!`);
          addNotification("Token deployed successfully!", "success");
          
          await saveTokenToDatabase(tokenAddress, userAddress);
          
          setFormData({
            name: '',
            symbol: '',
            totalSupply: '',
            liquidity: '',
            maxWalletPercentage: '',
          });

          loadTokens();
        }

      } catch (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    } finally {
      setIsDeploying(false);
    }
  };

  const saveTokenToDatabase = async (tokenAddress, userAddress) => {
    try {
      await tokenService.insertToken({
        token_address: tokenAddress,
        token_name: formData.name,
        token_symbol: formData.symbol,
        supply: parseFloat(formData.totalSupply),
        liquidity: parseFloat(formData.liquidity),
        max_wallet_percentage: parseFloat(formData.maxWalletPercentage),
        network: selectedChain,
        deployer_address: userAddress,
        token_image: formData.tokenImage
      });

      addNotification("Token saved to database", "success");
      
      // Recharger la liste des tokens
      const tokens = await tokenService.getTokens(selectedChain);
      if (Array.isArray(tokens)) {
        setTokens(tokens);
      }
    } catch (error) {
      console.error('Error saving token:', error);
      addNotification("Failed to save token to database", "error");
    }
  };

  // Fonction pour ajouter un token de test
  const handleAddTestToken = async () => {
    try {
      setIsLoading(true);
      await tokenService.addTestToken();
      // Recharger les tokens après l'ajout
      const tokens = await tokenService.getTokens(selectedChain);
      if (Array.isArray(tokens)) {
        setTokens(tokens);
      }
    } catch (error) {
      console.error('Error adding test token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <div className="fixed inset-0">
        <div className="grid-animation opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-fuchsia-900/20 to-cyan-900/30 animate-gradient-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,255,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10">
        <header className="bg-black/30 backdrop-blur-sm border-b border-fuchsia-500/20">
          <div className="container mx-auto flex justify-between items-center py-4 px-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 hover:scale-105 transition-transform cursor-default">
              Shadow Protocol
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddTestToken}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg"
              >
                Add Test Token
              </button>
              <NetworkSelector
                selectedChain={selectedChain}
                onChange={setSelectedChain}
              />
              <motion.button
                onClick={connectWallet}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all shadow-[0_0_15px_rgba(255,0,255,0.3)] hover:shadow-[0_0_25px_rgba(255,0,255,0.5)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                  {isWalletConnected ? "Connected" : "Connect Wallet"}
                </span>
              </motion.button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Featured Tokens
            </h2>
            <motion.button
              onClick={() => setActiveTab('create')}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all shadow-[0_0_15px_rgba(255,0,255,0.3)] hover:shadow-[0_0_25px_rgba(255,0,255,0.5)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                Create Token
              </span>
            </motion.button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500"></div>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">No tokens found on {NETWORKS[selectedChain].chainName}</p>
              <motion.button
                onClick={() => setActiveTab('create')}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                  Create the first token
                </span>
              </motion.button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tokens.map((token) => (
                  <motion.div
                    key={token.token_address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        {token.image_url ? (
                          <img
                            src={token.image_url}
                            alt={token.token_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">
                              {token.token_symbol.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-white">{token.token_name}</h3>
                          <p className="text-gray-400">{token.token_symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Supply: {token.supply}</p>
                        <p className="text-sm text-gray-400">
                          Liquidity: {token.liquidity} {NETWORKS[token.network].nativeCurrency.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                    dexscreener.com/base/0x0E2338661eC3E7ea8ffb8035b2bA8c385187926D?embed=1&theme=dark&trades=0&info=0&interval=1D:19 Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.
                      <Link
                        to={`/token/${token.token_address}`}
                        className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all text-sm text-gray-300"
                      >
                        View Details
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === 1 
                          ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-800/50 hover:bg-fuchsia-500/20 text-gray-300'
                      }`}
                      whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
                      whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
                    >
                      Previous
                    </motion.button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <motion.button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/50'
                            : 'bg-gray-800/50 hover:bg-fuchsia-500/20'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {page}
                      </motion.button>
                    ))}
                    
                    <motion.button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === totalPages
                          ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-800/50 hover:bg-fuchsia-500/20 text-gray-300'
                      }`}
                      whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
                      whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {activeTab === 'create' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-[100] overflow-y-auto py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl w-full mx-6 my-10"
            >
              <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 shadow-[0_0_25px_rgba(255,0,255,0.1)] hover:shadow-[0_0_35px_rgba(255,0,255,0.2)] transition-all">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400">
                    Create New Token
                  </h2>
                  <motion.button 
                    onClick={() => setActiveTab('tokens')}
                    className="p-2 rounded-full bg-gray-800/50 hover:bg-fuchsia-500/20 text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
                
                <form onSubmit={handleCreateToken} className="space-y-6">
                  <div className="space-y-4">
                    <div className="mb-6">
                      <label className="block text-gray-400 mb-2">Token Image</label>
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer hover:border-fuchsia-500/50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">Click to upload token image</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => setFormData({...formData, tokenImage: e.target.files[0]})}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-400 mb-2">Token Name</label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2 bg-black/30 border rounded-lg focus:outline-none transition-colors ${
                            formData.name && !validateText(formData.name, 'name')
                              ? 'border-red-500/50 focus:border-red-500/75' 
                              : 'border-gray-700 focus:border-fuchsia-500/50'
                          }`}
                          value={formData.name}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
                            setFormData({...formData, name: value});
                          }}
                          placeholder="e.g. Shadow Token"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-2">Token Symbol</label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2 bg-black/30 border rounded-lg focus:outline-none transition-colors ${
                            formData.symbol && !validateText(formData.symbol, 'symbol')
                              ? 'border-red-500/50 focus:border-red-500/75' 
                              : 'border-gray-700 focus:border-fuchsia-500/50'
                          }`}
                          value={formData.symbol}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                            setFormData({...formData, symbol: value});
                          }}
                          placeholder="e.g. SHDW"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-2">Total Supply</label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2 bg-black/30 border rounded-lg focus:outline-none transition-colors ${
                            formData.totalSupply && !validateInput(formData.totalSupply, NETWORK_LIMITS[selectedChain].minSupply, NETWORK_LIMITS[selectedChain].maxSupply, true)
                              ? 'border-red-500/50 focus:border-red-500/75' 
                              : 'border-gray-700 focus:border-fuchsia-500/50'
                          }`}
                          value={formData.totalSupply}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setFormData({...formData, totalSupply: value});
                          }}
                          placeholder={`${formatNumber(NETWORK_LIMITS[selectedChain].minSupply)} to ${formatNumber(NETWORK_LIMITS[selectedChain].maxSupply)}`}
                        />
                        {formData.totalSupply && !validateInput(formData.totalSupply, NETWORK_LIMITS[selectedChain].minSupply, NETWORK_LIMITS[selectedChain].maxSupply, true) && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-red-400 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {getErrorMessage('totalSupply', selectedChain)}
                          </motion.p>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-2">
                          {getLiquidityLabel(selectedChain)}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            className={`w-full px-4 py-2 bg-black/30 border rounded-lg focus:outline-none transition-colors ${
                              formData.liquidity && (
                                parseFloat(formData.liquidity) < NETWORK_LIMITS[selectedChain].minLiquidity ||
                                parseFloat(formData.liquidity) > NETWORK_LIMITS[selectedChain].maxLiquidity
                              ) 
                                ? 'border-red-500/50 focus:border-red-500/75' 
                                : 'border-gray-700 focus:border-fuchsia-500/50'
                            }`}
                            value={formData.liquidity}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              setFormData({...formData, liquidity: value});
                            }}
                            placeholder={getLiquidityPlaceholder(selectedChain)}
                          />
                          {formData.liquidity && tokenPrices[NETWORKS[selectedChain].nativeCurrency.symbol] > 0 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                              ≈ ${(parseFloat(formData.liquidity) * tokenPrices[NETWORKS[selectedChain].nativeCurrency.symbol]).toLocaleString('en-US', {maximumFractionDigits: 2})}
                            </div>
                          )}
                        </div>
                        {formData.liquidity && (
                          parseFloat(formData.liquidity) < NETWORK_LIMITS[selectedChain].minLiquidity ||
                          parseFloat(formData.liquidity) > NETWORK_LIMITS[selectedChain].maxLiquidity
                        ) && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-red-400 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Liquidity must be between {formatNumber(NETWORK_LIMITS[selectedChain].minLiquidity)} and {formatNumber(NETWORK_LIMITS[selectedChain].maxLiquidity)} {NETWORK_LIMITS[selectedChain].currency}
                          </motion.p>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-2">Max Wallet Percentage</label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2 bg-black/30 border rounded-lg focus:outline-none transition-colors ${
                            formData.maxWalletPercentage && !validateInput(formData.maxWalletPercentage, NETWORK_LIMITS[selectedChain].minWalletPercentage, NETWORK_LIMITS[selectedChain].maxWalletPercentage)
                              ? 'border-red-500/50 focus:border-red-500/75' 
                              : 'border-gray-700 focus:border-fuchsia-500/50'
                          }`}
                          value={formData.maxWalletPercentage}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setFormData({...formData, maxWalletPercentage: value});
                          }}
                          placeholder={`${NETWORK_LIMITS[selectedChain].minWalletPercentage} to ${NETWORK_LIMITS[selectedChain].maxWalletPercentage}%`}
                        />
                        {formData.maxWalletPercentage && !validateInput(formData.maxWalletPercentage, NETWORK_LIMITS[selectedChain].minWalletPercentage, NETWORK_LIMITS[selectedChain].maxWalletPercentage) && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-red-400 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {getErrorMessage('maxWalletPercentage', selectedChain)}
                          </motion.p>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-2">
                          Developer First Buy ({NETWORKS[selectedChain].nativeCurrency.symbol})
                        </label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2 bg-black/30 border rounded-lg focus:outline-none transition-colors ${
                            formData.deploymentFee && (
                              parseFloat(formData.deploymentFee) < NETWORK_LIMITS[selectedChain].minDeploymentFee ||
                              parseFloat(formData.deploymentFee) > (parseFloat(formData.liquidity) * 0.2)
                            ) 
                              ? 'border-red-500/50 focus:border-red-500/75' 
                              : 'border-gray-700 focus:border-fuchsia-500/50'
                          }`}
                          value={formData.deploymentFee}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setFormData({...formData, deploymentFee: value});
                          }}
                          placeholder={`${NETWORK_LIMITS[selectedChain].minDeploymentFee} to ${(parseFloat(formData.liquidity || 0) * 0.2).toFixed(2)} ${NETWORK_LIMITS[selectedChain].currency}`}
                        />
                        {formData.deploymentFee && (
                          parseFloat(formData.deploymentFee) < NETWORK_LIMITS[selectedChain].minDeploymentFee ||
                          parseFloat(formData.deploymentFee) > (parseFloat(formData.liquidity) * 0.2)
                        ) && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-red-400 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Fee must be between ${NETWORK_LIMITS[selectedChain].minDeploymentFee} and ${(parseFloat(formData.liquidity || 0) * 0.2).toFixed(2)} ${NETWORK_LIMITS[selectedChain].currency}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full mt-6 px-6 py-3 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      if (!isWalletConnected) {
                        e.preventDefault();
                        connectWallet();
                      }
                    }}
                  >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                      {!isWalletConnected 
                        ? "Connect Wallet to Create"
                        : "Create Token"
                      }
                    </span>
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {isDeploying && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-fuchsia-500/20 rounded-xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500 mx-auto mb-4"></div>
            <p className="text-fuchsia-400 text-center">{deploymentStatus}</p>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(({ id, message, type }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-4 rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-3 ${
              type === 'error' 
                ? 'bg-red-500/10 border border-red-500/50 text-red-400'
                : type === 'success'
                ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                : 'bg-gray-900/50 border border-fuchsia-500/50 text-fuchsia-400'
            }`}
          >
            {type === 'error' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {message}
          </motion.div>
        ))}
      </div>
    </main>
  );
} 