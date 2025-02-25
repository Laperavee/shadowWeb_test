import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useScroll, useTransform } from 'framer-motion';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabaseClient';
import { ethers } from 'ethers';

// ABI mis à jour pour correspondre exactement au contrat
const SHADOW_ABI = [
  "function deployToken(string name, string symbol, uint256 totalSupply, int24 tick, uint24 fee, bytes32 salt, address owner, string fid, address rewardAddress, uint256 maxWalletPercentage) external payable",
  "function generateSalt(address owner, string fid, string name, string symbol, uint256 totalSupply, uint256 maxWalletPercentage) external view returns (bytes32 salt, address token)",
  "function shadowDeploymentFee() external view returns (uint256)"
];

const SHADOW_ADDRESS = import.meta.env.VITE_SHADOW_ADDRESS;
if (!SHADOW_ADDRESS) {
  console.error("Shadow contract address not found in environment variables");
}

// Ajout de l'ABI pour le token SHADOW
const SHADOW_TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

const SHADOW_TOKEN_ADDRESS = "0x1d008f50FB828eF9DEbBBEAe1B71FfFe929bf317";

export default function ShadowFun() {
  const [activeTab, setActiveTab] = useState('tokens');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [tokens, setTokens] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    liquidity: '',
    maxWalletPercentage: '',
    tokenImage: null
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState('');

  // Connexion MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsWalletConnected(true);
      } catch (error) {
        console.error("Wallet connection error:", error);
      }
    } else {
      alert("MetaMask is not installed!");
    }
  };

  // Gestion de la création du token
  const handleCreateToken = async (e) => {
    e.preventDefault();
    
    if (!isWalletConnected || !SHADOW_ADDRESS) {
      alert("Please connect your wallet first!");
      return;
    }

    // Validation des champs
    if (!formData.name || !formData.symbol || !formData.totalSupply || !formData.liquidity || !formData.maxWalletPercentage) {
      alert("Please fill all fields");
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('Initializing deployment...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      console.log("Connected address:", userAddress);
      
      // Connexion au token SHADOW
      const shadowToken = new ethers.Contract(
        SHADOW_TOKEN_ADDRESS,
        SHADOW_TOKEN_ABI,
        signer
      );

      // Connexion au contrat Shadow
      const shadow = new ethers.Contract(
        SHADOW_ADDRESS,
        SHADOW_ABI,
        signer
      );

      // Vérifier la balance et l'allowance
      setDeploymentStatus('Checking SHADOW balance and allowance...');
      const shadowFee = await shadow.shadowDeploymentFee();
      const balance = await shadowToken.balanceOf(userAddress);
      const allowance = await shadowToken.allowance(userAddress, SHADOW_ADDRESS);

      console.log("Shadow fee required:", ethers.formatEther(shadowFee), "SHADOW");
      console.log("Current balance:", ethers.formatEther(balance), "SHADOW");
      console.log("Current allowance:", ethers.formatEther(allowance), "SHADOW");

      if (balance < shadowFee) {
        throw new Error(`Insufficient SHADOW balance. You need ${ethers.formatEther(shadowFee)} SHADOW`);
      }

      // Approuver les tokens si nécessaire
      if (allowance < shadowFee) {
        setDeploymentStatus('Approving SHADOW tokens...');
        const approveTx = await shadowToken.approve(
          SHADOW_ADDRESS,
          ethers.parseEther("1000") // Approuver une grande quantité
        );
        await approveTx.wait();
        console.log("SHADOW tokens approved");
      }

      // Calcul du FID
      const timestamp = Math.floor(Date.now() / 1000);
      const symbolBinary = formData.symbol
        .split('')
        .map(char => char.charCodeAt(0).toString(2))
        .join('');
      const symbolBase10 = parseInt(symbolBinary, 2);
      const fid = Math.floor(timestamp * Math.PI * symbolBase10).toString();

      console.log("Generated FID:", fid);

      // Conversion des valeurs
      const totalSupplyWei = ethers.parseEther(formData.totalSupply.toString());
      const maxWalletPercentage = Math.floor(parseFloat(formData.maxWalletPercentage) * 10);

      // Générer le salt
      setDeploymentStatus('Generating salt...');
      const saltResult = await shadow.generateSalt(
        userAddress,
        fid,
        formData.name,
        formData.symbol,
        totalSupplyWei,
        maxWalletPercentage
      );

      const salt = saltResult.salt;
      console.log("Generated salt:", salt);

      // Calcul du tick
      const price = parseFloat(formData.totalSupply) / parseFloat(formData.liquidity);
      const tickSpacing = 200;
      const sqrtPriceX96 = Math.sqrt(1/price) * Math.pow(2, 96);
      const initialTick = Math.floor(Math.log(sqrtPriceX96 / Math.pow(2, 96)) / Math.log(Math.sqrt(1.0001)));
      const validTick = Math.floor(initialTick / tickSpacing) * tickSpacing;

      console.log("Calculated tick:", validTick);

      // Déployer le token
      setDeploymentStatus('Deploying token...');
      const tx = await shadow.deployToken(
        formData.name,
        formData.symbol,
        totalSupplyWei,
        validTick,
        10000, // 1% fee
        salt,
        userAddress,
        fid,
        userAddress,
        maxWalletPercentage,
        {
          value: ethers.parseEther("0.001"),
          gasLimit: 10000000
        }
      );

      setDeploymentStatus('Waiting for confirmation...');
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      setDeploymentStatus('Token deployed successfully!');
      alert(`Transaction confirmed! Check on Basescan: https://basescan.org/tx/${tx.hash}`);

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        symbol: '',
        totalSupply: '',
        liquidity: '',
        maxWalletPercentage: ''
      });

    } catch (error) {
      console.error("Error creating token:", error);
      setDeploymentStatus('Deployment failed: ' + error.message);
      alert(`Error: ${error.message}`);
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