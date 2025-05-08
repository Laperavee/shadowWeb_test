import { createContext, useContext, useEffect, useState } from 'react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { createConfig, WagmiProvider, useConnect, useAccount } from 'wagmi';
import { mainnet } from 'viem/chains';
import { http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import { ethers } from 'ethers';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

// Configuration des connecteurs pour supporter à la fois Rabby et MetaMask
const connectors = [
  injected({
    target: 'rabby',
    shimDisconnect: true,
  }),
  injected({
    target: 'metaMask',
    shimDisconnect: true,
  }),
];

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors
});

const WalletContext = createContext();

// Fonction pour définir un cookie
const setCookie = (name, value, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Strict";
};

// Fonction pour récupérer un cookie
const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

// Fonction pour supprimer un cookie
const eraseCookie = (name) => {
  document.cookie = name + '=; Max-Age=-99999999; path=/';
};

function WalletProviderContent({ children }) {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loginWithWallet = async (walletAddress, signature) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/.netlify/functions/loginwithwallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message: `Sign this message to verify your wallet ownership: ${walletAddress}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // Store session data
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      setCookie('token', data.token);

      setUserAddress(walletAddress);
      setIsWalletConnected(true);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      // Essayer d'abord Rabby, puis MetaMask
      let rabbyConnector = connectors.find(c => c.name === 'Rabby');
      let metaMaskConnector = connectors.find(c => c.name === 'MetaMask');

      // Vérifier si Rabby est disponible
      if (window.rabby) {
        await connect({ connector: rabbyConnector });
      } 
      // Sinon essayer MetaMask
      else if (window.ethereum) {
        await connect({ connector: metaMaskConnector });
      } else {
        throw new Error('No wallet found. Please install Rabby or MetaMask');
      }
      
      if (address) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const message = `Sign this message to verify your wallet ownership: ${address}`;
        const signature = await signer.signMessage(message);
        
        await loginWithWallet(address, signature);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Trouver le connecteur actif
      const activeConnector = connectors.find(c => c.ready);
      if (activeConnector) {
        await activeConnector.disconnect();
      }
      
      // Clear session data
      setUserAddress(null);
      setIsWalletConnected(false);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      eraseCookie('token');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError(error.message || 'Failed to disconnect wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      setUserAddress(address);
      setIsWalletConnected(true);
    } else {
      setUserAddress(null);
      setIsWalletConnected(false);
    }
  }, [isConnected, address]);

  return (
    <WalletContext.Provider
      value={{
        isWalletConnected,
        userAddress,
        connectWallet,
        disconnectWallet,
        loading,
        error
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider chains={[mainnet]}>
          <WalletProviderContent>
            {children}
          </WalletProviderContent>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 