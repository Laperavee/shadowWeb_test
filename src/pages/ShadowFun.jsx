import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ShadowArtifact from '../artifact/Shadow.json';
import avaxLogo from '../../dist/assets/avax_logo.png';
import { CONTRACTS } from '../config/contracts';
import { tokenService } from '../services/tokenService';
import { realtimeService } from '../services/realtimeService';
import { priceService } from '../services/priceService';
import { Link, useNavigate } from 'react-router-dom';

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
        <div className="absolute top-full left-0 mt-2 w-20 bg-black border border-gray-800 rounded-lg z-50">
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tokens');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    liquidity: '',
    maxWalletPercentage: '',
    deploymentFee: '0.00001',
    isFeatured: false,
    deployerAddress: '',
    tokenImage: null
  });

  const [shadowContract, setShadowContract] = useState(null);
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

  const insertTestToken = async () => {
    try {
      const testToken = {
        token_address: "0x" + Math.random().toString(16).substr(2, 40),
        token_name: "Test Token " + Math.floor(Math.random() * 1000),
        token_symbol: "TEST" + Math.floor(Math.random() * 1000),
        supply: Math.floor(Math.random() * 1000000),
        liquidity: Math.floor(Math.random() * 1000),
        max_wallet_percentage: Math.floor(Math.random() * 10) + 1,
        network: selectedChain,
        deployer_address: "0x" + Math.random().toString(16).substr(2, 40),
        token_image: null,
        tx_hash: "0x" + Math.random().toString(16).substr(2, 64),
        pool_address: "0x" + Math.random().toString(16).substr(2, 40)
      };

      console.log('Attempting to insert test token:', testToken);
      
      const response = await tokenService.insertToken(testToken);
      console.log('Insert response:', response);
      
      if (response && response.error) {
        throw new Error(response.error);
      }
      
      addNotification("Test token inserted successfully!", "success");
      loadTokens(); // Recharger la liste des tokens
    } catch (error) {
      console.error('Error inserting test token:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      addNotification(`Failed to insert test token: ${error.message}`, "error");
    }
  };

  const loadTokens = async () => {
    try {
      setIsLoading(true);
      const tokens = await tokenService.getTokens(selectedChain);
      if (Array.isArray(tokens)) {
        console.log('Tokens loaded:', tokens.length);
        setTokens(tokens);
        // Calculer le nombre total de pages (10 tokens par page)
        setTotalPages(Math.ceil(tokens.length / 10));
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les tokens à afficher pour la page courante
  const getCurrentPageTokens = () => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    return tokens.slice(startIndex, endIndex);
  };

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

  // Utiliser le service de prix au lieu de faire des appels directs à CoinGecko
  useEffect(() => {
    // Fonction pour mettre à jour les prix
    const updatePrices = async () => {
      try {
        const prices = await priceService.getPrices();
        setTokenPrices(prices);
      } catch (error) {
        console.error('Failed to fetch token prices:', error);
      }
    };

    // Mettre à jour les prix immédiatement
    updatePrices();
    
    // S'abonner aux mises à jour de prix
    const unsubscribe = priceService.subscribeToUpdates((prices) => {
      setTokenPrices(prices);
    });
    
    // Nettoyer l'abonnement quand le composant est démonté
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadTokens();
    
    // S'abonner aux mises à jour en temps réel des tokens
    const unsubscribe = realtimeService.subscribeToTokens(selectedChain, (payload) => {
      console.log('Token update received:', payload);
      
      // Selon le type d'événement, on met à jour les tokens
      if (payload.eventType === 'INSERT') {
        // Ajouter un nouveau token
        setTokens(prevTokens => {
          // Vérifier si le token existe déjà
          const exists = prevTokens.some(token => token.token_address === payload.new.token_address);
          if (exists) return prevTokens;
          
          // Ajouter le nouveau token au début de la liste
          return [payload.new, ...prevTokens];
        });
      } else if (payload.eventType === 'UPDATE') {
        // Mettre à jour un token existant
        setTokens(prevTokens => 
          prevTokens.map(token => 
            token.token_address === payload.new.token_address ? payload.new : token
          )
        );
      } else if (payload.eventType === 'DELETE') {
        // Supprimer un token
        setTokens(prevTokens => 
          prevTokens.filter(token => token.token_address !== payload.old.token_address)
        );
      }
    });
    
    // Nettoyer l'abonnement quand le composant est démonté ou quand le réseau change
    return () => {
      unsubscribe();
    };
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

    try {
      setIsDeploying(true);
      setDeploymentStatus("Deploying token...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const deployerAddress = userAddress;

      const network = await provider.getNetwork();

      // Connexion au contrat Shadow
      const shadow = new ethers.Contract(
        SHADOW_ADDRESS,
        SHADOW_ABI,
        signer
      );

      // Connexion au contrat SHADOW token
      const shadowToken = new ethers.Contract(
        SHADOW_TOKEN_ADDRESS,
        ["function approve(address spender, uint256 amount) public returns (bool)", "function allowance(address owner, address spender) public view returns (uint256)"],
        signer
      );

      // Vérifier les frais de déploiement en SHADOW
      const shadowFee = await shadow.shadowDeploymentFee();
      const allowance = await shadowToken.allowance(userAddress, SHADOW_ADDRESS);

      if (allowance < shadowFee) {
        setDeploymentStatus('Approving SHADOW tokens...');
        const approveTx = await shadowToken.approve(SHADOW_ADDRESS, ethers.parseEther('1000'));
        await approveTx.wait();
      }
    
      const maxWalletPercentage = parseFloat(formData.maxWalletPercentage)*10;

      setDeploymentStatus('Generating salt...');
      const result = await shadow.generateSalt.staticCall(
        deployerAddress,
        formData.name,
        formData.symbol,
        BigInt(ethers.parseEther(formData.totalSupply)),
        maxWalletPercentage,
        formData.isFeatured
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
        deployerAddress,
        parseInt(maxWalletPercentage),
        formData.isFeatured,
        {
          value: ethers.parseEther(formData.deploymentFee),
          gasLimit: 8000000
        }
      );

      setDeploymentStatus('Waiting for confirmation...');
      const receipt = await tx.wait();
      
      // Chercher l'événement PoolCreated
      const poolCreatedEvent = receipt.events.find(e => e.event === 'PoolCreated');

      // Chercher l'événement TokenCreated
      const tokenCreatedEvent = receipt.events.find(e => e.event === 'TokenCreated');

      if (tokenCreatedEvent && poolCreatedEvent) {
        const tokenAddress = tokenCreatedEvent.args ? 
          tokenCreatedEvent.args[0] : 
          `0x${tokenCreatedEvent.topics[1].slice(26)}`;
        
        // Récupérer l'adresse de la pool depuis l'événement PoolCreated
        let poolAddress;
        if (poolCreatedEvent.args) {
          poolAddress = poolCreatedEvent.args[4]; // L'adresse de la pool est le 5ème argument
        } else if (poolCreatedEvent.data) {
          // Extraire l'adresse de la pool depuis les données de l'événement
          // Les données contiennent tickSpacing (32 bytes) suivi de l'adresse de la pool (32 bytes)
          poolAddress = `0x${poolCreatedEvent.data.slice(66)}`; // 66 = 2 (0x) + 64 (32 bytes)
        } else {
          throw new Error('Could not extract pool address from event');
        }
        
        if (!tokenAddress || !poolAddress) {
          throw new Error('Failed to extract token or pool address from events');
        }
        
        setDeploymentStatus(`Token deployed successfully at ${tokenAddress}!`);
        addNotification("Token deployed successfully!", "success");
        
        await saveTokenToDatabase(tokenAddress, deployerAddress, receipt.hash, poolAddress);
        
        // Réinitialiser le formulaire
        setFormData({
          name: '',
          symbol: '',
          totalSupply: '',
          liquidity: '',
          maxWalletPercentage: '',
          deploymentFee: '0.00001',
          deployerAddress: '',
          tokenImage: null
        });

        // Fermer le modal de création
        setActiveTab('tokens');
      }

    } catch (error) {
      console.error('Error in token creation:', error);
      addNotification(error.message || "Error creating token", "error");
    } finally {
      setIsDeploying(false);
    }
  };

  const saveTokenToDatabase = async (tokenAddress, deployerAddress, txHash, poolAddress) => {
    try {
      if (!txHash) {
        throw new Error('Transaction hash is required');
      }

      await tokenService.insertToken({
        token_address: tokenAddress,
        token_name: formData.name,
        token_symbol: formData.symbol,
        supply: parseFloat(formData.totalSupply),
        liquidity: parseFloat(formData.liquidity),
        max_wallet_percentage: parseFloat(formData.maxWalletPercentage),
        network: selectedChain,
        deployer_address: deployerAddress,
        token_image: formData.tokenImage,
        tx_hash: txHash,
        pool_address: poolAddress
      });

      addNotification("Token saved to database", "success");
      
      // Mettre à jour la liste des tokens
      const tokens = await tokenService.getTokens(selectedChain);
      if (Array.isArray(tokens)) {
        setTokens(tokens);
      }
      
      // Forcer une redirection avec rechargement de page pour s'assurer que la page du token s'affiche correctement
      window.location.href = `/token/${tokenAddress}`;
    } catch (error) {
      console.error('Error saving token:', error);
      addNotification("Failed to save token to database", "error");
    }
  };

  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,255,0.1),transparent_50%)] animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-fuchsia-900/20 to-cyan-900/30 animate-gradient-slow" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.9),transparent_50%,rgba(0,0,0,0.9))]" />
        <div className="absolute inset-0">
          <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/30 rounded-full blur-3xl animate-blob" />
          <div className="absolute w-96 h-96 -top-48 -right-48 bg-cyan-500/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute w-96 h-96 -bottom-48 -left-48 bg-fuchsia-500/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
          <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-purple-500/30 rounded-full blur-3xl animate-blob animation-delay-6000" />
        </div>
      </div>

      <div className="relative z-10">
        {/* Enhanced header with glass effect */}
        <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-fuchsia-500/20 shadow-lg">
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="container mx-auto flex flex-col sm:flex-row justify-between items-center py-4 px-6 gap-4"
          >
            <motion.div
              className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Link to="/" className="cursor-pointer">
                Shadow Protocol
              </Link>
            </motion.div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <NetworkSelector
                selectedChain={selectedChain}
                onChange={setSelectedChain}
              />
              <Link
                to="/posts"
                className="relative px-6 py-2.5 rounded-xl group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
                <div className="relative flex items-center gap-2">
                  <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                  </svg>
                  <span className="text-white font-semibold">
                    News
                  </span>
                </div>
              </Link>
              <Link
                to="/staking"
                className="relative px-6 py-2.5 rounded-xl group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
                <div className="relative flex items-center gap-2">
                  <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-semibold">
                    Staking
                  </span>
                </div>
              </Link>
              <motion.button
                onClick={connectWallet}
                className="relative px-6 py-2.5 rounded-xl group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
                <div className="relative flex items-center gap-2">
                  <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-white font-semibold">
                    {isWalletConnected ? "Connected" : "Connect Wallet"}
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 py-8">
          {/* Enhanced section header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12"
          >
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-3"
              >
                Featured Tokens
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-sm sm:text-base max-w-lg"
              >
                Discover and trade the latest tokens on {NETWORKS[selectedChain].chainName}. 
                Join our community of traders and find the next gem.
              </motion.p>
            </div>
            <div className="flex gap-4">
              <motion.button
                onClick={insertTestToken}
                className="relative px-4 py-2.5 rounded-xl group/button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-10 group-hover/button:opacity-20 transition-opacity rounded-xl" />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <div className="relative flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                    Insert Test Token
                  </span>
                </div>
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('create')}
                className="relative px-4 py-2.5 rounded-xl group/button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <div className="relative flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                    Create Token
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Enhanced loading state */}
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center py-32"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full blur-xl animate-pulse" />
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-fuchsia-500/20 rounded-full blur-xl" />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : tokens.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32 px-4"
            >
              <div className="inline-block p-8 rounded-2xl bg-black/50 backdrop-blur-xl border border-fuchsia-500/20 shadow-[0_0_25px_rgba(255,0,255,0.1)]">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full blur-xl animate-pulse-slow" />
                  <div className="relative flex items-center justify-center w-full h-full">
                    <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">No Tokens Found</h3>
                <p className="text-gray-400 mb-6">Be the first to create a token on {NETWORKS[selectedChain].chainName}</p>
                <motion.button
                  onClick={() => setActiveTab('create')}
                  className="relative px-8 py-3 rounded-xl group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                  <span className="relative text-white font-semibold">Create First Token</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Enhanced token grid with stagger animation */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {getCurrentPageTokens().map((token) => (
                  <motion.div
                    key={token.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="group relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-all duration-300 cursor-pointer"
                    onClick={() => window.location.href = `/token/${token.token_address}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-start gap-4 mb-6">
                        {token.image_url ? (
                          <motion.img
                            src={token.image_url}
                            alt={token.token_name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-fuchsia-500/20"
                            whileHover={{ scale: 1.05 }}
                          />
                        ) : (
                          <motion.div
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 border-2 border-fuchsia-500/20 flex items-center justify-center "
                            whileHover={{ scale: 1.05 }}
                          >
                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 to-cyan-400">
                              {token.token_symbol.charAt(0)}
                            </span>
                          </motion.div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-fuchsia-400 group-hover:to-cyan-400 transition-all">
                            {token.token_name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-sm font-medium">
                              ${token.token_symbol}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-900/30 group-hover:bg-fuchsia-500/5 transition-colors">
                          <span className="text-gray-400">Supply</span>
                          <span className="font-medium text-white">{parseInt(token.supply).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-900/30 group-hover:bg-fuchsia-500/5 transition-colors">
                          <span className="text-gray-400">Liquidity</span>
                          <span className="font-medium text-white">
                            {token.liquidity} {NETWORKS[token.network].nativeCurrency.symbol}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <motion.a
                          href={`https://dexscreener.com/avalanche/${token.token_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative px-4 py-2.5 rounded-xl group/button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                          <div className="relative flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
                              Dexscreener
                            </span>
                          </div>
                        </motion.a>
                        <motion.a
                          href={`${NETWORKS[token.network].blockExplorerUrls[0]}/address/${token.token_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative px-4 py-2.5 rounded-xl group/button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-10 group-hover/button:opacity-20 transition-opacity rounded-xl" />
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                          <div className="relative flex items-center justify-center">
                            <svg className="w-4 h-4 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        </motion.a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Enhanced pagination */}
              {totalPages > 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center mt-12"
                >
                  <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-black/50 backdrop-blur-xl border border-fuchsia-500/20">
                    <motion.button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative px-4 py-2 rounded-xl ${
                        currentPage === 1 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-fuchsia-500/10'
                      }`}
                      whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
                      whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <motion.button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative w-10 h-10 rounded-xl ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20'
                              : 'hover:bg-fuchsia-500/10'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className={`text-sm font-medium ${
                            currentPage === page ? 'text-white' : 'text-gray-400'
                          }`}>
                            {page}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                    
                    <motion.button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative px-4 py-2 rounded-xl ${
                        currentPage === totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-fuchsia-500/10'
                      }`}
                      whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
                      whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
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