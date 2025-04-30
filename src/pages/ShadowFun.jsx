import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import avaxLogo from '../../dist/assets/avax_logo.png';
import baseLogo from '../../dist/assets/base_logo.png';
import { CONTRACTS } from '../config/contracts';
import { tokenService } from '../services/tokenService';
import { realtimeService } from '../services/realtimeService';
import { priceService } from '../services/priceService';
import { Link, useNavigate } from 'react-router-dom';
import ShadowBaseArtifact from '../artifact/ShadowBase.json';
import ShadowAvaxArtifact from '../artifact/ShadowAvax.json';
import { supabase } from '../lib/supabase';
import { useWallet } from '../context/WalletContext';
import { useSound } from '../context/SoundContext';
import { useNotification } from '../context/NotificationContext';
import { useNetwork } from '../context/NetworkContext';

const SHADOW_CREATOR_ABI = {
  BASE: ShadowBaseArtifact.abi,
  AVAX: ShadowAvaxArtifact.abi
};

const NETWORKS = {
  AVAX: {
    chainId: "0xa86a",
    chainName: "Avalanche C-Chain",
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
    disabled: false,
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
    minLiquidity: 1000,
    maxLiquidity: 100000,
    minSupply: 100000,
    maxSupply: 1000000000,
    minWalletPercentage: 0.1,
    maxWalletPercentage: 10,
    minDeploymentFee: 0.00001,
    minFirstBuyAmount: 0.1,
    firstBuyPercentage: 20,
    currency: 'AVAX'
  },
  BASE: {
    minLiquidity: 10,
    maxLiquidity: 1000,
    minSupply: 100000,
    maxSupply: 1000000000,
    minWalletPercentage: 0.1,
    maxWalletPercentage: 10,
    minDeploymentFee: 0.00001,
    minFirstBuyAmount: 0.01,
    firstBuyPercentage: 20,
    currency: 'ETH'
  }
};

const NetworkSelector = ({ selectedChain, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-all duration-300"
      >
        <img src={NETWORKS[selectedChain].logo} alt={NETWORKS[selectedChain].chainName} className="w-6 h-6" />
        <span className="text-white">{NETWORKS[selectedChain].chainName}</span>
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[160px] rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
          {Object.entries(NETWORKS).map(([key, network], index, array) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left flex items-center space-x-2 ${
                key === selectedChain
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              } ${
                index === 0 ? "rounded-t-lg" : 
                index === array.length - 1 ? "rounded-b-lg" : ""
              }`}
            >
              <img src={network.logo} alt={network.chainName} className="w-6 h-6" />
              <span className="text-white">{network.chainName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

export default function ShadowFun() {
  const navigate = useNavigate();
  const { selectedChain } = useNetwork();
  const { isWalletConnected, userAddress, connectWallet } = useWallet();
  const { playSound } = useSound();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('tokens');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [shadowContract, setShadowContract] = useState(null);
  const [shadowToken, setShadowToken] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    liquidity: '',
    maxWalletPercentage: '',
    firstBuyAmount: '',
    deploymentFee: '0.00001',
    deployerAddress: '',
    tokenImage: null,
    twitterConnected: false,
    websiteUrl: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [tokens, setTokens] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tokenPrices, setTokenPrices] = useState({
    AVAX: 0,
    ETH: 0
  });

  const [isConnectMenuOpen, setIsConnectMenuOpen] = useState(false);

  const [definedData, setDefinedData] = useState(null);
  const [definedLoading, setDefinedLoading] = useState(false);
  const [definedLink, setDefinedLink] = useState('');

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tokenService.getTokens(selectedChain);
      setTokens(data);
      setTotalPages(Math.ceil(data.length / 10));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading tokens:', error);
      showNotification('Failed to load tokens', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedChain, showNotification]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    const checkTwitterAuth = async () => {
      try {
        console.log('🔄 Checking Twitter authentication status...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error checking session:', error);
          return;
        }

        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          const twitterHandle = user?.user_metadata?.user_name;
          console.log('✅ Twitter connected as:', twitterHandle);
          setTwitterHandle(twitterHandle);
        } else {
          console.log('❌ No Twitter connection found');
        }
      } catch (error) {
        console.error('❌ Error checking Twitter auth:', error);
      }
    };

    checkTwitterAuth();
  }, []);

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setIsWalletConnected(false);
        setUserAddress('');
      } else {
        setUserAddress(accounts[0]);
      }
    };

    const handleChainChanged = (chainId) => {
      if (chainId !== NETWORKS[selectedChain].chainId) {
        setIsWalletConnected(false);
        setUserAddress('');
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [selectedChain]);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          
          if (accounts.length > 0 && chainId === NETWORKS[selectedChain].chainId) {
            console.log('Wallet connecté:', accounts[0]);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de la connexion du wallet:', error);
        }
      }
    };

    checkWalletConnection();
  }, [selectedChain]);

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

  useEffect(() => {
    const updateContracts = async () => {
      if (window.ethereum && isWalletConnected) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const shadowAddress = CONTRACTS[selectedChain].SHADOW_ADDRESS;
        
        const shadow = new ethers.Contract(
          shadowAddress,
          SHADOW_CREATOR_ABI[selectedChain],
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
    fetchTokens();
    
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

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Validation du nom
    if (!formData.name.trim()) {
      errors.name = 'Token name is required';
      isValid = false;
    } else if (!validateText(formData.name, 'name')) {
      errors.name = 'Token name must be between 1 and 50 characters and contain only letters, numbers and spaces';
      isValid = false;
    }

    // Validation du symbole
    if (!formData.symbol.trim()) {
      errors.symbol = 'Token symbol is required';
      isValid = false;
    } else if (!validateText(formData.symbol, 'symbol')) {
      errors.symbol = 'Token symbol must be between 1 and 10 characters and contain only letters and numbers';
      isValid = false;
    }

    // Validation de la supply totale
    const totalSupply = parseFloat(formData.totalSupply);
    if (isNaN(totalSupply) || totalSupply <= 0) {
      errors.totalSupply = 'Total supply must be greater than 0';
      isValid = false;
    } else if (totalSupply < NETWORK_LIMITS[selectedChain].minSupply || 
               totalSupply > NETWORK_LIMITS[selectedChain].maxSupply) {
      errors.totalSupply = getErrorMessage('totalSupply', selectedChain);
      isValid = false;
    }

    // Validation de la liquidité
    const liquidity = parseFloat(formData.liquidity);
    if (isNaN(liquidity) || liquidity <= 0) {
      errors.liquidity = 'Liquidity must be greater than 0';
      isValid = false;
    } else if (liquidity < NETWORK_LIMITS[selectedChain].minLiquidity || 
               liquidity > NETWORK_LIMITS[selectedChain].maxLiquidity) {
      errors.liquidity = getErrorMessage('liquidity', selectedChain);
      isValid = false;
    }

    // Validation du pourcentage max wallet
    const maxWalletPercentage = parseFloat(formData.maxWalletPercentage);
    if (isNaN(maxWalletPercentage) || maxWalletPercentage <= 0) {
      errors.maxWalletPercentage = 'Max wallet percentage must be greater than 0';
      isValid = false;
    } else if (maxWalletPercentage < NETWORK_LIMITS[selectedChain].minWalletPercentage || 
               maxWalletPercentage > NETWORK_LIMITS[selectedChain].maxWalletPercentage) {
      errors.maxWalletPercentage = getErrorMessage('maxWalletPercentage', selectedChain);
      isValid = false;
    }

    // Validation du firstBuyAmount
    const firstBuyAmount = parseFloat(formData.firstBuyAmount);
    if (isNaN(firstBuyAmount) || firstBuyAmount <= 0) {
      errors.firstBuyAmount = 'First buy amount must be greater than 0';
      isValid = false;
    } else if (firstBuyAmount > liquidity * 0.2) {
      errors.firstBuyAmount = 'First buy amount cannot exceed 20% of the initial liquidity';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const switchNetwork = async (chain) => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask!');
      }

      const chainId = NETWORKS[chain].chainId;
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

      if (currentChainId !== chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              const networkParams = {
                chainId: NETWORKS[chain].chainId,
                chainName: NETWORKS[chain].chainName,
                nativeCurrency: NETWORKS[chain].nativeCurrency,
                rpcUrls: NETWORKS[chain].rpcUrls,
                blockExplorerUrls: NETWORKS[chain].blockExplorerUrls
              };
              
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkParams],
              });
            } catch (addError) {
              console.error('Error adding network:', addError);
              throw new Error(`Failed to add ${NETWORKS[chain].chainName} network to MetaMask`);
            }
          } else {
            console.error('Error switching network:', switchError);
            throw new Error(`Failed to switch to ${NETWORKS[chain].chainName} network`);
          }
        }
      }
    } catch (error) {
      console.error('Network switch error:', error);
      throw error;
    }
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!window.ethereum) {
      addNotification("Please install MetaMask!", "error");
      return;
    }

    try {
      if (!isWalletConnected) {
        await connectWallet();
        return;
      }

      setIsDeploying(true);
      setDeploymentStatus("Checking network...");

      // Switch to the correct network
      await switchNetwork(selectedChain);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Upload token image if provided
      let imageUrl = null;
      if (formData.tokenImage) {
        setDeploymentStatus("Uploading token image...");
        imageUrl = await tokenService.uploadTokenImage(formData.tokenImage);
        if (!imageUrl) {
          throw new Error("Failed to upload token image");
        }
      }

      const shadow = new ethers.Contract(
        CONTRACTS[selectedChain].SHADOW_ADDRESS,
        SHADOW_CREATOR_ABI[selectedChain],
        signer
      );

      console.log('shadow:', shadow);

      setDeploymentStatus('Generating salt...');

      const maxWalletPercentage = (formData.maxWalletPercentage * 10).toString();
      const fee = 10000;
      
      // S'assurer que le handle Twitter a le @
      const twitterName = twitterHandle.startsWith('@') ? twitterHandle : `@${twitterHandle}`|| 'empty';
      
      // Vérifier si un site web est fourni, sinon utiliser une URL par défaut
      const websiteUrl = formData.websiteUrl.trim() || 'empty';

      console.log('Arguments pour generateSalt:', {
        deployer: userAddress,
        name: formData.name,
        symbol: formData.symbol,
        supply: formData.totalSupply,
        maxWalletPercentage: maxWalletPercentage,
        twitterName: twitterName,
        websiteUrl: websiteUrl
      });

      try {
        const result = await shadow.generateSalt(
          userAddress,
          formData.name,
          formData.symbol,
          ethers.parseEther(formData.totalSupply),
          maxWalletPercentage,
          twitterName,
          websiteUrl
        );
        
        console.log('Résultat de generateSalt:', result);
        const salt = result[0];
        const predictedTokenAddress = result[1];
        console.log('Salt généré:', salt);
        console.log('Token address prédit:', predictedTokenAddress);

        setDeploymentStatus('Deploying token...');

        console.log('Paramètres pour deployToken:', {
          name: formData.name,
          symbol: formData.symbol,
          supply: ethers.parseEther(formData.totalSupply),
          liquidity: ethers.parseEther(formData.liquidity),
          fee: fee.toString(),
          salt: salt,
          deployer: userAddress,
          maxWalletPercentage: maxWalletPercentage,
          firstBuyAmount: ethers.parseEther(formData.firstBuyAmount),
          twitterName: twitterName,
          websiteUrl: websiteUrl
        });

        const tx = await shadow.deployToken(
          formData.name,
          formData.symbol,
          ethers.parseEther(formData.totalSupply),
          ethers.parseEther(formData.liquidity),
          fee,
          salt,
          userAddress,
          maxWalletPercentage,
          ethers.parseEther(formData.firstBuyAmount),
          twitterName,
          websiteUrl,
          {
            value: ethers.parseEther(formData.firstBuyAmount),
            gasLimit: 8000000
          }
        );

        console.log('Transaction envoyée:', tx.hash);

        setDeploymentStatus('Waiting for confirmation...');
        const receipt = await tx.wait();
        
        console.log('Transaction confirmée:', receipt);
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const transactionReceipt = await provider.getTransactionReceipt(receipt.hash);
        
        console.log('Transaction receipt:', transactionReceipt);
        
        if (!transactionReceipt) {
          throw new Error("Transaction not found");
        }

        setDeploymentStatus(`Token deployed successfully at ${predictedTokenAddress}!`);
        addNotification("Token deployed successfully!", "success");
        
        await saveTokenToDatabase(predictedTokenAddress, userAddress, receipt.hash, imageUrl);
        
        setFormData({
          name: '',
          symbol: '',
          totalSupply: '',
          liquidity: '',
          maxWalletPercentage: '',
          firstBuyAmount: '',
          deploymentFee: '0.00001',
          tokenImage: null,
          websiteUrl: ''
        });

        setActiveTab('tokens');
      } catch (error) {
        console.error('Error in token deployment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in token creation:', error);
      addNotification(error.message || "Error creating token", "error");
    } finally {
      setIsDeploying(false);
    }
  };

  const saveTokenToDatabase = async (tokenAddress, deployerAddress, txHash, imageUrl) => {
    if (txHash === "") {
      return;
    }
    try {
      // Récupérer le nonce du wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nonce = await provider.getTransactionCount(deployerAddress);
      console.log('Nonce:', nonce);
      const isFresh = nonce < 100;

      console.log('Saving token to database with data:', {
        token_address: tokenAddress,
        token_name: formData.name,
        token_symbol: formData.symbol,
        supply: parseFloat(formData.totalSupply),
        liquidity: parseFloat(formData.liquidity),
        max_wallet_percentage: parseFloat(formData.maxWalletPercentage),
        network: selectedChain,
        deployer_address: deployerAddress,
        token_image: imageUrl,
        twitter_handle: twitterHandle,
        website_url: formData.websiteUrl,
        is_fresh: isFresh
      });

      const response = await tokenService.insertToken({
        token_address: tokenAddress,
        token_name: formData.name,
        token_symbol: formData.symbol,
        supply: parseFloat(formData.totalSupply),
        liquidity: parseFloat(formData.liquidity),
        max_wallet_percentage: parseFloat(formData.maxWalletPercentage),
        network: selectedChain,
        deployer_address: deployerAddress,
        token_image: imageUrl,
        twitter_handle: twitterHandle,
        website_url: formData.websiteUrl,
        is_fresh: isFresh
      });

      console.log('Insert response:', response);

      if (response && response.error) {
        throw new Error(response.error);
      }

      addNotification("Token saved to database", "success");
      
      // Mettre à jour la liste des tokens
      const tokens = await tokenService.getTokens(selectedChain);
      if (Array.isArray(tokens)) {
        setTokens(tokens);
      }
      
      // Ne pas rediriger automatiquement
      // window.location.href = `/token/${tokenAddress}`;
    } catch (error) {
      console.error('Error saving token:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      addNotification(`Failed to save token to database: ${error.message}`, "error");
    }
  };

  // Calculer le montant maximum d'achat (20% de la liquidité)
  const calculateMaxBuyAmount = (liquidity) => {
    if (!liquidity) return 0
    return (parseFloat(liquidity) * 0.2).toFixed(4)
  }

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

          setTokens(prevTokens => 
            prevTokens.map(token => 
              token.token_address === tokenAddress ? { ...token, market_data: marketData } : token
            )
          );
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données Defined:', err);
    } finally {
      setDefinedLoading(false);
    }
  }, []);

  // Update Defined URL when timeframe changes
  useEffect(() => {
    if (!tokens.length) return;
    
    const timeframeParam = timeframe === '24h' ? '1m' : timeframe === '7d' ? '1W' : '1M';
    const definedNetwork = selectedChain?.toUpperCase() === 'AVAX' ? 'avalanche' : selectedChain?.toLowerCase();
    setDefinedLink(`https://www.defined.fi/${definedNetwork}/${tokens[0].token_address}?embedded=1&hideTxTable=1&hideSidebar=1&hideChart=0&hideChartEmptyBars=1&chartSmoothing=0&embedColorMode=DEFAULT&interval=${timeframeParam}&hideVolume=1`);
  }, [timeframe, selectedChain, tokens]);

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

      <div className="relative z-10 pt-24">
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
                onClick={() => setActiveTab('create')}
                className="relative px-4 py-2.5 rounded-xl group/button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
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
          {loading ? (
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
                {getCurrentPageTokens().map((token) => {
                  return (
                  <motion.div
                    key={token.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="group relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/token/${token.token_address}`)}
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
                            href={definedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                            className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                          >
                            View on Defined
                        </motion.a>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
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
                    <div className="mb-4">
                      <label className="block text-gray-400 mb-2">Token Image</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer hover:border-fuchsia-500/50">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-400">Click to upload image</span>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => setFormData({...formData, tokenImage: e.target.files[0]})}
                          />
                        </label>
                        {formData.tokenImage && (
                          <span className="text-sm text-gray-400">{formData.tokenImage.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-400 mb-2">Token Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 text-white"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Enter token name"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">Token Symbol</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 text-white"
                          value={formData.symbol}
                          onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                          placeholder="Enter token symbol"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">Total Supply</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 text-white"
                          value={formData.totalSupply}
                          onChange={(e) => setFormData({...formData, totalSupply: e.target.value})}
                          placeholder={`Enter total supply (${NETWORK_LIMITS[selectedChain].minSupply} - ${NETWORK_LIMITS[selectedChain].maxSupply})`}
                        />
                        {formErrors.totalSupply && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.totalSupply}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">Initial Liquidity ({NETWORKS[selectedChain].nativeCurrency.symbol})</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 text-white"
                          value={formData.liquidity}
                          onChange={(e) => setFormData({...formData, liquidity: e.target.value})}
                          placeholder={`Enter initial liquidity (${NETWORK_LIMITS[selectedChain].minLiquidity} - ${NETWORK_LIMITS[selectedChain].maxLiquidity} ${NETWORKS[selectedChain].nativeCurrency.symbol})`}
                        />
                        {formErrors.liquidity && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.liquidity}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">Max Wallet Percentage</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 text-white"
                          value={formData.maxWalletPercentage}
                          onChange={(e) => setFormData({...formData, maxWalletPercentage: e.target.value})}
                          placeholder={`Enter max wallet percentage (${NETWORK_LIMITS[selectedChain].minWalletPercentage}% - ${NETWORK_LIMITS[selectedChain].maxWalletPercentage}%)`}
                        />
                        {formErrors.maxWalletPercentage && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.maxWalletPercentage}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">
                          First Buy Amount ({NETWORKS[selectedChain].nativeCurrency.symbol})
                          {formData.liquidity && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Max: {calculateMaxBuyAmount(formData.liquidity)} {NETWORKS[selectedChain].nativeCurrency.symbol})
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 text-white"
                          value={formData.firstBuyAmount}
                          onChange={(e) => setFormData({...formData, firstBuyAmount: e.target.value})}
                          placeholder={`Enter first buy amount (${NETWORK_LIMITS[selectedChain].minFirstBuyAmount} - ${calculateMaxBuyAmount(formData.liquidity)} ${NETWORKS[selectedChain].nativeCurrency.symbol})`}
                          max={calculateMaxBuyAmount(formData.liquidity)}
                        />
                        {formErrors.firstBuyAmount && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.firstBuyAmount}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">Website URL (Optional)</label>
                        <input
                          type="url"
                          className="w-full px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 text-white"
                          value={formData.websiteUrl}
                          onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                          placeholder="https://example.com"
                        />
                        {formErrors.websiteUrl && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.websiteUrl}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        type="submit"
                        disabled={isDeploying}
                        className="relative px-4 py-2 rounded-xl group/button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
                        <div className="relative flex items-center justify-center gap-2">
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                            {isDeploying ? 'Deploying...' : 'Create Token'}
                          </span>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}