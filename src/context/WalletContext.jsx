import { createContext, useContext, useEffect, useState } from 'react';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { createConfig, WagmiProvider, useConnect, useAccount } from 'wagmi';
import { mainnet } from 'viem/chains';
import { http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

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

function WalletProviderContent({ children }) {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState(null);

  const connectWallet = async () => {
    try {
      const rabbyConnector = connectors.find(c => c.name === 'Rabby');
      if (rabbyConnector) {
        await connect({ connector: rabbyConnector });
      } else {
        console.error('Rabby wallet not found');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    try {
      const rabbyConnector = connectors.find(c => c.name === 'Rabby');
      if (rabbyConnector) {
        await rabbyConnector.disconnect();
      }
      setUserAddress(null);
      setIsWalletConnected(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
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