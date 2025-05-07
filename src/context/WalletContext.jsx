import { createContext, useContext, useEffect, useState } from 'react';
import { createConfig, configureChains, mainnet } from 'wagmi';
import { http } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';

const { chains, publicClient } = configureChains(
  [mainnet],
  [http()]
);

const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: 'f1ad805003699db13c2091756ea71984', // Vous devrez obtenir un projectId de WalletConnect
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'Shadow Web',
      },
    }),
  ],
});

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState(null);

  const connectWallet = async () => {
    try {
      const result = await config.connectors[0].connect();
      if (result.account) {
        setUserAddress(result.account);
        setIsWalletConnected(true);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    try {
      await config.connectors[0].disconnect();
      setUserAddress(null);
      setIsWalletConnected(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await config.connectors[0].isAuthorized();
      if (isConnected) {
        const account = await config.connectors[0].getAccount();
        setUserAddress(account);
        setIsWalletConnected(true);
      }
    };
    checkConnection();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isWalletConnected,
        userAddress,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 