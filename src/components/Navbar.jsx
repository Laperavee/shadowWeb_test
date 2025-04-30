import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../context/SoundContext';
import { supabase } from '../lib/supabase';
import avaxLogo from '../../dist/assets/avax_logo.png';
import baseLogo from '../../dist/assets/base_logo.png';

const NETWORKS = {
  AVAX: {
    chainId: "0xa86a",
    chainName: "Avalanche",
    logo: avaxLogo,
    disabled: false,
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18
    },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"]
  },
  BASE: {
    chainId: "0x2105",
    chainName: "Base",
    logo: baseLogo,
    disabled: false,
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"]
  }
};

const NetworkSelector = ({ selectedChain, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 transition-all duration-300"
      >
        <img src={NETWORKS[selectedChain].logo} alt={NETWORKS[selectedChain].chainName} className="w-6 h-6" />
        <span className="text-white">{NETWORKS[selectedChain].chainName}</span>
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[160px] rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
          {Object.entries(NETWORKS).map(([key, network], index, array) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left flex items-center space-x-2 ${
                key === selectedChain
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              } ${
                index === 0 ? "rounded-t-lg" : 
                index === array.length - 1 ? "rounded-b-lg" : ""
              }`}
            >
              <img src={network.logo} alt={network.chainName} className="w-6 h-6" />
              <span className="text-white">{network.chainName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState(null);
  const [selectedChain, setSelectedChain] = useState(() => {
    const savedChain = localStorage.getItem('selectedChain');
    return savedChain || 'AVAX';
  });
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

  const handleTwitterDisconnect = async () => {
    try {
      await supabase.auth.signOut();
      setTwitterHandle(null);
      playSound('click');
    } catch (error) {
      console.error('Error disconnecting Twitter:', error);
    }
  };

  const handleNavigation = useCallback((path) => {
    navigate(path);
    playSound('click');
    setIsMobileMenuOpen(false);
  }, [navigate, playSound]);

  if (location.pathname === '/shadow-fun') {
    return null;
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'
      } py-4`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            className="text-2xl font-bold interactive"
            onMouseEnter={() => playSound('hover')}
          >
            <motion.span 
              className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 inline-block"
              whileHover={{ 
                scale: 1.05,
                backgroundImage: "linear-gradient(to right, #8B5CF6, #3B82F6, #8B5CF6)",
                backgroundSize: "200% 100%",
                backgroundPosition: "right center",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Shadow Protocol
            </motion.span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <NetworkSelector selectedChain={selectedChain} onChange={setSelectedChain} />
            <Link
              to="/posts"
              className="relative px-6 py-2.5 rounded-xl group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
              <div className="relative flex items-center gap-2">
                <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                </svg>
                <span className="text-white font-semibold">
                  News
                </span>
              </div>
            </Link>
            <Link
              to="/staking"
              className="relative px-6 py-2.5 rounded-xl group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
              <div className="relative flex items-center gap-2">
                <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white font-semibold">
                  Staking
                </span>
              </div>
            </Link>
            {twitterHandle ? (
              <motion.button
                onClick={handleTwitterDisconnect}
                className="bg-gradient-to-r from-red-600/20 to-red-400/20 border border-red-400/20 px-6 py-2 rounded-xl hover:border-red-400/50 transition-all interactive relative group"
                onMouseEnter={() => playSound('hover')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300">
                  Disconnect @{twitterHandle}
                </span>
              </motion.button>
            ) : (
              <motion.button
                onClick={() => handleNavigation('/shadow-fun')}
                className="bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 border border-fuchsia-400/20 px-6 py-2 rounded-xl hover:border-fuchsia-400/50 transition-all interactive relative group"
                onMouseEnter={() => playSound('hover')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                  Launch App
                </span>
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="md:hidden text-white interactive relative"
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              playSound('click');
            }}
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <motion.span
                animate={isMobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className="w-full h-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 block transition-transform"
              />
              <motion.span
                animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="w-full h-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 block"
              />
              <motion.span
                animate={isMobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className="w-full h-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 block transition-transform"
              />
            </div>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4"
            >
              <motion.div 
                className="flex flex-col gap-4 py-4"
                variants={{
                  open: {
                    transition: { staggerChildren: 0.1 }
                  }
                }}
                initial="closed"
                animate="open"
              >
                <NetworkSelector selectedChain={selectedChain} onChange={setSelectedChain} />
                <Link
                  to="/posts"
                  className="relative px-6 py-2.5 rounded-xl group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
                  <div className="relative flex items-center gap-2">
                    <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                    </svg>
                    <span className="text-white font-semibold">
                      News
                    </span>
                  </div>
                </Link>
                <Link
                  to="/staking"
                  className="relative px-6 py-2.5 rounded-xl group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover/button:opacity-40 transition-opacity rounded-xl" />
                  <div className="relative flex items-center gap-2">
                    <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white font-semibold">
                      Staking
                    </span>
                  </div>
                </Link>
                {twitterHandle ? (
                  <motion.button
                    onClick={handleTwitterDisconnect}
                    className="bg-gradient-to-r from-red-600/20 to-red-400/20 border border-red-400/20 px-6 py-2 rounded-xl hover:border-red-400/50 transition-all mx-4 text-center interactive block w-full"
                  >
                    Disconnect @{twitterHandle}
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => handleNavigation('/shadow-fun')}
                    className="bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 border border-fuchsia-400/20 px-6 py-2 rounded-xl hover:border-fuchsia-400/50 transition-all mx-4 text-center interactive block w-full"
                  >
                    Launch App
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
} 