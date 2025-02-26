import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import { ethers } from 'ethers';
import ShadowArtifact from '../artifact/Shadow.json';
import avaxLogo from '../../dist/assets/avax_logo.png';
import baseLogo from '../../dist/assets/base_logo.png';
import { CONTRACTS } from '../config/contracts';

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
          // TO DO : Redirect to the token page when created
          // window.location.href = `/token/${tokenAddress}`;
        }

        setFormData({
          name: '',
          symbol: '',
          totalSupply: '',
          liquidity: '',
          maxWalletPercentage: '',
        });

      } catch (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <div className="fixed inset-0">
        <div className="grid-animation opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/10 to-black" />
      </div>

      <div className="relative z-10">
        <header className="py-6 px-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Shadow Protocol
            </h1>
            <div className="flex items-center gap-4">
              <NetworkSelector
                selectedChain={selectedChain}
                onChange={setSelectedChain}
              />
              <motion.button
                onClick={connectWallet}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all"
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

        <div className="flex justify-center mt-8 mb-12">
          <div className="flex gap-2 p-1 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800">
            <motion.button
              onClick={() => setActiveTab('tokens')}
              className={`
                px-6 py-2.5 rounded-lg transition-all duration-300
                ${activeTab === 'tokens' 
                  ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/50' 
                  : 'hover:bg-gray-800/50'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={`
                text-sm font-medium
                ${activeTab === 'tokens'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
                }
              `}>
                My Tokens
              </span>
            </motion.button>

            <motion.button
              onClick={() => setActiveTab('create')}
              className={`
                px-6 py-2.5 rounded-lg transition-all duration-300
                ${activeTab === 'create' 
                  ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/50' 
                  : 'hover:bg-gray-800/50'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={`
                text-sm font-medium
                ${activeTab === 'create'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
                }
              `}>
                Create Token
              </span>
            </motion.button>
          </div>
        </div>

        <section className="container mx-auto px-4 py-12">
          {activeTab === 'tokens' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-fuchsia-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src="/placeholder-token.png" 
                    alt="Token" 
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">$SHADOW</h3>
                    <p className="text-gray-400">Shadow Protocol</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-fuchsia-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                    </svg>
                    <a href="#" className="text-fuchsia-400 hover:text-fuchsia-300">@ShadowToken</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c-4.97 0-9-4.03-9-9m9 9a9 9 0 0 0 9-9m-9 9c4.97 0 9-4.03 9-9"/>
                    </svg>
                    <a href="#" className="text-cyan-400 hover:text-cyan-300">shadow.com</a>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Created on 03/01/2024</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-1 rounded-lg bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 border border-fuchsia-500/20 hover:border-fuchsia-500/50"
                  >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                      View
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleCreateToken} className="space-y-6">
                <div className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
                  <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                    Create New Token
                  </h2>
                  
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
                        type="number"
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
                      <input
                        type="number"
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
                          const value = parseFloat(e.target.value);
                          const { minLiquidity, maxLiquidity } = NETWORK_LIMITS[selectedChain];
                          
                          setFormData({
                            ...formData, 
                            liquidity: e.target.value
                          });
                        }}
                        placeholder={getLiquidityPlaceholder(selectedChain)}
                      />
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
                        type="number"
                        step="0.1"
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
                        type="number"
                        step="0.01"
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
                </div>
              </form>
            </motion.div>
          )}
        </section>
      </div>

      {isDeploying && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-fuchsia-500/20">
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

      <Footer />
    </main>
  );
}

<style>
  {`
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type=number] {
      -moz-appearance: textfield;
    }
  `}
</style> 