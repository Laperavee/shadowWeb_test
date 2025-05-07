import { createContext, useContext, useEffect, useState } from 'react';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { createConfig, WagmiConfig } from 'wagmi';
import { mainnet } from 'viem/chains';
import { http } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const { connectors } = getDefaultWallets({
  appName: 'Shadow Web',
  projectId: 'f1ad805003699db13c2091756ea71984',
  chains: [mainnet]
});

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors
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
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={[mainnet]}>
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
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 