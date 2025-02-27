import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { tokenService } from '../services/tokenService';

// Transactions de secours au cas où la base de données ne répond pas
const fallbackTransactions = [
  { type: 'BUY', tokenSymbol: 'SHADOW', amount: '1,234', price: '0.45', timestamp: new Date() },
  { type: 'SELL', tokenSymbol: 'PEPE', amount: '50,000', price: '0.32', timestamp: new Date() },
  { type: 'BUY', tokenSymbol: 'DOGE', amount: '10,000', price: '0.89', timestamp: new Date() },
  { type: 'BUY', tokenSymbol: 'SHIB', amount: '5,000,000', price: '0.12', timestamp: new Date() },
  { type: 'SELL', tokenSymbol: 'FLOKI', amount: '2,345', price: '0.67', timestamp: new Date() },
];

const TransactionBanner = () => {
  const [transactions, setTransactions] = useState(fallbackTransactions);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour formater le temps écoulé
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    
    return Math.floor(seconds) + 's ago';
  };

  // Charger les transactions depuis Supabase
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const recentTransactions = await tokenService.getRecentTransactions(20);
        if (recentTransactions && recentTransactions.length > 0) {
          setTransactions(recentTransactions);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        // En cas d'erreur, on garde les transactions de secours
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
    
    // Rafraîchir les transactions toutes les 30 secondes
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simuler de nouvelles transactions si on utilise les transactions de secours
  useEffect(() => {
    if (!isLoading && transactions === fallbackTransactions) {
      const interval = setInterval(() => {
        const newTransaction = {
          type: Math.random() > 0.5 ? 'BUY' : 'SELL',
          tokenSymbol: ['SHADOW', 'PEPE', 'DOGE', 'SHIB', 'FLOKI'][Math.floor(Math.random() * 5)],
          amount: Math.floor(Math.random() * 1000000).toLocaleString(),
          price: (Math.random() * 1).toFixed(2),
          timestamp: new Date()
        };
        setTransactions(prev => [newTransaction, ...prev.slice(0, -1)]);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isLoading, transactions]);

  return (
    <div className="w-full bg-black/30 backdrop-blur-sm border-b border-fuchsia-500/20 overflow-hidden">
      <div className="animate-scroll flex py-2">
        {transactions.concat(transactions).map((tx, i) => (
          <div 
            key={i}
            className="flex items-center gap-4 px-6 min-w-max"
          >
            <span className={`text-sm font-bold ${
              tx.type === 'BUY' ? 'text-green-400' : 'text-red-400'
            }`}>
              {tx.type}
            </span>
            <span className="text-sm font-bold text-fuchsia-400">${tx.tokenSymbol}</span>
            <span className="text-sm text-gray-400">{tx.amount} tokens</span>
            <span className="text-sm text-gray-400">@ ${tx.price}</span>
            <span className="text-xs text-gray-500">{timeAgo(tx.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionBanner; 