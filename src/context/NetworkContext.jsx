import { createContext, useContext, useState, useEffect } from 'react';

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [selectedChain, setSelectedChain] = useState(() => {
    const savedChain = localStorage.getItem('selectedChain');
    return savedChain || 'AVAX';
  });

  useEffect(() => {
    localStorage.setItem('selectedChain', selectedChain);
  }, [selectedChain]);

  return (
    <NetworkContext.Provider value={{ selectedChain, setSelectedChain }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
} 