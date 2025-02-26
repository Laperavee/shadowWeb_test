import { motion } from 'framer-motion';
import { useState } from 'react';
import Footer from '../components/Footer';
import { ethers } from 'ethers';
import ShadowArtifact from '../artifact/Shadow.json';
import avaxLogo from '../../dist/assets/avax_logo.png';
import baseLogo from '../../dist/assets/base_logo.png';

const SHADOW_ABI = ShadowArtifact.abi;

const SHADOW_ADDRESS = import.meta.env.VITE_SHADOW_ADDRESS;
const SHADOW_TOKEN_ADDRESS = import.meta.env.VITE_SHADOW_TOKEN_ADDRESS;

if (!SHADOW_ADDRESS || !SHADOW_TOKEN_ADDRESS) {
  console.error("Missing environment variables:", {
    SHADOW_ADDRESS: !!SHADOW_ADDRESS,
    SHADOW_TOKEN_ADDRESS: !!SHADOW_TOKEN_ADDRESS
  });
}

console.log("SHADOW_ABI generateSalt:", SHADOW_ABI.find(item => 
  item.name === "generateSalt"
));

console.log("SHADOW_ADDRESS:", SHADOW_ADDRESS);

const NETWORKS = {
  BASE: {
    chainId: "0x2105",
    chainName: "Base",
    logo: baseLogo,
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"]
  },
  AVAX: {
    chainId: "0xa86a",
    chainName: "Avalanche",
    logo: avaxLogo,
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18
    },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"]
  }
};

// Ajouter une fonction pour changer de réseau
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
          console.error('Error adding network:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching network:', switchError);
        throw switchError;
      }
    }
  }
};

// Modifier le NetworkSelector pour utiliser switchNetwork
const NetworkSelector = ({ selectedChain, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNetworkChange = async (newChain) => {
    try {
      if (window.ethereum && window.ethereum.selectedAddress) {
        await switchNetwork(newChain);
      }
      onChange(newChain);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
      alert(`Failed to switch to ${NETWORKS[newChain].chainName}. Please try again.`);
    }
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg bg-black border border-gray-800 cursor-pointer hover:border-fuchsia-500/50"
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
        <div className="absolute top-full left-0 mt-2 bg-black border border-gray-800 rounded-lg overflow-hidden z-50">
          {Object.entries(NETWORKS).map(([key, network]) => (
            <div
              key={key}
              onClick={() => handleNetworkChange(key)}
              className={`p-2 cursor-pointer hover:bg-gray-900 ${
                selectedChain === key ? 'bg-gray-900' : ''
              }`}
            >
              <img
                src={network.logo}
                alt={network.chainName}
                className="w-6 h-6"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
    fullAccess: false
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState('');

  const [selectedChain, setSelectedChain] = useState('AVAX');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
  
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log("Current chain ID:", chainId);
        
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
              console.error('Error switching network:', switchError);
              throw switchError;
            }
          }
        }
        setIsWalletConnected(true);
      } catch (error) {
        console.error("Wallet connection error:", error);
        alert(`Please make sure you're connected to ${NETWORKS[selectedChain].chainName}`);
      }
    } else {
      alert("MetaMask is not installed!");
    }
  };
  const handleCreateToken = async (e) => {
    e.preventDefault();
    
    if (!SHADOW_ADDRESS || !SHADOW_TOKEN_ADDRESS) {
      alert("Contract addresses not configured. Please check environment variables.");
      return;
    }

    if (!isWalletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!formData.name || !formData.symbol || !formData.totalSupply || !formData.liquidity || !formData.maxWalletPercentage) {
      alert("Please fill all fields");
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('Initializing deployment...');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    console.log("Wallet connecté :", userAddress);

    const network = await provider.getNetwork();
    console.log("Chaîne connectée:", network.chainId);

    try {


      console.log("Connected address:", userAddress);
      
      const shadow = new ethers.Contract(
        SHADOW_ADDRESS,
        SHADOW_ABI,
        signer
      );
    
      const maxWalletPercentage = parseFloat(formData.maxWalletPercentage)*10;

      setDeploymentStatus('Generating salt...');
      try {        
        console.log("Calling generateSalt with params:", {
          userAddress, 
          name: formData.name,
          symbol: formData.symbol,
          supply: BigInt(ethers.parseEther(formData.totalSupply)),
          maxWalletPercentage: maxWalletPercentage
        });

        const result = await shadow.generateSalt.staticCall(
          userAddress, 
          formData.name,
          formData.symbol,
          BigInt(ethers.parseEther(formData.totalSupply)),
          maxWalletPercentage
        );

        console.log("Raw result:", result);

        const [salt, predictedAddress] = result;

        console.log("Salt:", salt);
        console.log("Predicted token address:", predictedAddress);

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
            value: ethers.parseEther("0.00001"),
            gasLimit: 8000000
          }
        );

        setDeploymentStatus('Waiting for confirmation...');
        console.log("Transaction sent:", tx.hash);
        
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
          alert(`Token deployed! Check on Basescan: https://basescan.org/address/${tokenAddress}`);
        }

        setFormData({
          name: '',
          symbol: '',
          totalSupply: '',
          liquidity: '',
          maxWalletPercentage: '',
        });

      } catch (error) {
        console.error("Error details:", {
          error,
          params: {
            deployer: userAddress,
            name: formData.name,
            symbol: formData.symbol,
            supply: formData.totalSupply,
            maxWalletPercentage: formData.maxWalletPercentage
          }
        });
        throw error;
      }

    } catch (error) {
      console.error("Error details:", {
        error,
        params: {
          deployer: userAddress,
          name: formData.name,
          symbol: formData.symbol,
          supply: formData.totalSupply,
          maxWalletPercentage: formData.maxWalletPercentage
        }
      });
      throw error;
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Background with Shadow style */}
      <div className="fixed inset-0">
        <div className="grid-animation opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/10 to-black" />
      </div>

      <div className="relative z-10">
        {/* Header with connect button */}
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

        {/* Navigation Tabs */}
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

        {/* Content */}
        <section className="container mx-auto px-4 py-12">
          {activeTab === 'tokens' ? (
            // Liste des tokens existante
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Token card example */}
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
            // Formulaire de création
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
                  
                  {/* Image Upload */}
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

                  {/* Token Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-2">Token Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:border-fuchsia-500/50 focus:outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Shadow Token"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">Token Symbol</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:border-fuchsia-500/50 focus:outline-none"
                        value={formData.symbol}
                        onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                        placeholder="e.g. SHDW"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">Total Supply</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:border-fuchsia-500/50 focus:outline-none"
                        value={formData.totalSupply}
                        onChange={(e) => setFormData({...formData, totalSupply: e.target.value})}
                        placeholder="1 to 1B"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">Initial Liquidity (ETH)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:border-fuchsia-500/50 focus:outline-none"
                        value={formData.liquidity}
                        onChange={(e) => setFormData({...formData, liquidity: e.target.value})}
                        placeholder="10 to 200"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">Max Wallet Percentage</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:border-fuchsia-500/50 focus:outline-none"
                        value={formData.maxWalletPercentage}
                        onChange={(e) => setFormData({...formData, maxWalletPercentage: e.target.value})}
                        placeholder="0.1 to 10%"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full mt-6 px-6 py-3 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!isWalletConnected}
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

      {/* Ajout d'un indicateur de statut */}
      {isDeploying && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl border border-fuchsia-500/20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500 mx-auto mb-4"></div>
            <p className="text-fuchsia-400 text-center">{deploymentStatus}</p>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
} 