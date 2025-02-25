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
      await signer.getAddress(),
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
      await signer.getAddress(),
      fid,
      await signer.getAddress(),
      maxWalletPercentage,
      {
        value: ethers.parseEther("0.001"),
        gasLimit: 10000000
      }
    );

    const receipt = await tx.wait();

    // Gérer l'upload de l'image si nécessaire
    if (formData.tokenImage) {
      const { data, error } = await supabase.storage
        .from('token-images')
        .upload(`${receipt.contractAddress}`, formData.tokenImage);
      
      if (error) throw error;
    }

    return {
      success: true,
      transaction: tx.hash,
      tokenAddress: receipt.contractAddress
    };

  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
} 