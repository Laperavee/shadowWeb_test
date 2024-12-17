import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useScroll, useTransform } from 'framer-motion';
import Footer from '../components/Footer';

export default function ShadowFun() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [tokens, setTokens] = useState([]);

  // Temporary function for MetaMask connection
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

        {/* Tokens grid */}
        <section className="container mx-auto px-4 py-12">
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
        </section>
      </div>

      <Footer />
    </main>
  );
} 