import { createContext, useContext, useEffect, useState } from 'react';
import { createConfig } from 'wagmi';
import { http } from 'wagmi';
import { mainnet } from 'viem/chains';
import { 
  injected, 
  walletConnect, 
  coinbaseWallet,
  rabby,
  phantom 
} from 'wagmi/connectors';

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: 'f1ad805003699db13c2091756ea71984',
    }),
    coinbaseWallet({
      appName: 'Shadow Web',
    }),
    rabby(),
    phantom(),
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