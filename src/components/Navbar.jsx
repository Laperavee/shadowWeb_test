import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSound } from '../context/SoundContext';
import { useWallet } from '../context/WalletContext';
import { supabase } from '../lib/supabase';
import logo from '../assets/image1.png';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConnectMenuOpen, setIsConnectMenuOpen] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState(null);
  const { isWalletConnected, userAddress, connectWallet, disconnectWallet } = useWallet();
  const { playSound } = useSound();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkTwitterAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata?.user_name) {
          setTwitterHandle(session.user.user_metadata.user_name);
        }
      } catch (error) {
        console.error('Error checking Twitter auth:', error);
      }
    };
    checkTwitterAuth();
  }, []);

  const handleTwitterConnect = async (e) => {
    e.preventDefault();
    try {
      const currentUrl = window.location.href;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: currentUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'tweet.read users.read'
          }
        }
      });

      if (error) throw error;
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting to Twitter:', error);
    }
  };

  const handleTwitterDisconnect = async () => {
    try {
      await supabase.auth.signOut();
      setTwitterHandle(null);
      playSound('click');
    } catch (error) {
      console.error('Error disconnecting Twitter:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-black/50 backdrop-blur-xl border-b border-fuchsia-500/20 shadow-lg h-24">
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="container mx-auto px-4 h-full"
      >
        <div className="flex items-center justify-between h-full">
          {/* Logo and Navigation Links */}
          <div className="flex items-center gap-4 sm:gap-8">
            <motion.div
              className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Link to="/" className="cursor-pointer flex items-center">
                <img src={logo} alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16" />
              </Link>
            </motion.div>
            <div className="hidden sm:flex items-center gap-4 lg:gap-6">
              <Link
                to="/shadow-fun"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-base lg:text-lg font-bold px-2 lg:px-3 py-2 group"
              >
                <span className="relative">
                  Tokens
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                </span>
              </Link>
              <Link
                to="https://shadow-19.gitbook.io/shadow-docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group px-2 lg:px-3 py-2"
                onClick={() => playSound('click')}
              >
                <span className="relative text-base lg:text-lg font-bold">
                  Docs
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                </span>
              </Link>
              <Link
                to="/news"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-base lg:text-lg font-bold px-2 lg:px-3 py-2 group"
              >
                <span className="relative">
                  News
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
                </span>
              </Link>
            </div>
          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/staking"
              className="relative px-3 sm:px-6 py-2 rounded-xl group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
              <div className="relative flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white text-sm sm:text-base font-semibold">
                  Staking
                </span>
              </div>
            </Link>
            <div className="relative">
              <motion.button
                onClick={() => setIsConnectMenuOpen(!isConnectMenuOpen)}
                className="relative px-3 sm:px-6 py-2 rounded-xl group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
                <div className="relative flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-white text-sm sm:text-base font-semibold">
                    {isWalletConnected ? 'Connected' : 'Connect'}
                  </span>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </motion.button>

              {isConnectMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 min-w-[300px] rounded-xl bg-black/80 backdrop-blur-xl border border-fuchsia-500/20 shadow-[0_0_25px_rgba(255,0,255,0.1)]"
                >
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Wallet Connection Status */}
                      <div className={`relative p-4 rounded-xl border ${
                        isWalletConnected 
                          ? 'border-green-500/50 bg-green-500/10' 
                          : 'border-gray-700 bg-gray-800/50'
                      }`}>
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            isWalletConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                          }`} />
                          <div className="text-center">
                            <p className="text-sm font-medium text-white">Wallet</p>
                            {isWalletConnected && (
                              <p className="text-xs text-gray-400 truncate max-w-[120px]">
                                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Twitter Connection Status */}
                      <div className={`relative p-4 rounded-xl border ${
                        twitterHandle 
                          ? 'border-blue-500/50 bg-blue-500/10' 
                          : 'border-gray-700 bg-gray-800/50'
                      }`}>
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            twitterHandle ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'
                          }`} />
                          <div className="text-center">
                            <p className="text-sm font-medium text-white">Twitter</p>
                            {twitterHandle && (
                              <p className="text-xs text-gray-400">@{twitterHandle}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (isWalletConnected) {
                            disconnectWallet();
                          } else {
                            connectWallet();
                          }
                          setIsConnectMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left flex items-center space-x-2 hover:bg-fuchsia-500/10 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-white">
                          {isWalletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
                        </span>
                      </button>
                      {twitterHandle ? (
                        <button
                          onClick={handleTwitterDisconnect}
                          className="w-full px-4 py-2.5 text-left flex items-center space-x-2 hover:bg-fuchsia-500/10 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                          <span className="text-white">
                            Disconnect Twitter
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            handleTwitterConnect(e);
                            setIsConnectMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center space-x-2 hover:bg-fuchsia-500/10 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                          <span className="text-white">
                            Connect Twitter
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
} 