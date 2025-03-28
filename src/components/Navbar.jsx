import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../context/SoundContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleNavigation = useCallback((path) => {
    navigate(path);
    playSound('click');
    setIsMobileMenuOpen(false);
  }, [navigate, playSound]);

  if (location.pathname === '/shadow-fun') {
    return null;
  }

  const menuItems = [
    { title: "How it Works", path: "/how-it-works" },
    { title: "Features", path: "/features" },
    { title: "News", path: "/posts" }
  ];

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
              className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 inline-block"
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
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`interactive text-lg ${location.pathname === item.path ? 'text-fuchsia-400' : 'text-white'}`}
                onMouseEnter={() => playSound('hover')}
              >
                <motion.span
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/90 to-cyan-400/90"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {item.title}
                </motion.span>
              </Link>
            ))}
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
                className="w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 block transition-transform"
              />
              <motion.span
                animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 block"
              />
              <motion.span
                animate={isMobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className="w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 block transition-transform"
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
                {menuItems.map((item) => (
                  <motion.div
                    key={item.path}
                    variants={{
                      open: { x: 0, opacity: 1 },
                      closed: { x: -20, opacity: 0 }
                    }}
                  >
                    <Link
                      to={item.path}
                      className="text-gray-300 hover:text-white transition-colors px-4 py-2 interactive block relative group"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        playSound('click');
                      }}
                    >
                      <span className="relative">
                        {item.title}
                        <motion.div
                          className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full"
                          transition={{ duration: 0.3 }}
                        />
                      </span>
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  variants={{
                    open: { x: 0, opacity: 1 },
                    closed: { x: -20, opacity: 0 }
                  }}
                >
                  <button
                    onClick={() => handleNavigation('/shadow-fun')}
                    className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/20 px-6 py-2 rounded-xl hover:border-purple-500/50 transition-all mx-4 text-center interactive block w-full"
                  >
                    Launch App
                  </button>
                </motion.div>
                <motion.a
                  href="#features"
                  className="text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Features
                </motion.a>
                <motion.a
                  href="#how-it-works"
                  className="text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  How it Works
                </motion.a>
                <motion.a
                  href="/posts"
                  className="text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  News
                </motion.a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
} 