import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSound } from '../context/SoundContext';

export default function HomeNavbar() {
  const { playSound } = useSound();

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-50 bg-transparent py-4"
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

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/how-it-works"
              className="text-white hover:text-purple-400 transition-colors interactive"
              onMouseEnter={() => playSound('hover')}
            >
              How it Works
            </Link>
            <Link
              to="/features"
              className="text-white hover:text-purple-400 transition-colors interactive"
              onMouseEnter={() => playSound('hover')}
            >
              Features
            </Link>
            <Link
              to="/posts"
              className="text-white hover:text-purple-400 transition-colors interactive"
              onMouseEnter={() => playSound('hover')}
            >
              News
            </Link>
            <motion.button
              onClick={() => window.location.href = '/shadow-fun'}
              className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/20 px-6 py-2 rounded-xl hover:border-purple-500/50 transition-all interactive relative group"
              onMouseEnter={() => playSound('hover')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Launch App
              </span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="md:hidden text-white interactive relative"
            onClick={() => playSound('click')}
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <motion.span
                className="w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 block"
              />
              <motion.span
                className="w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 block"
              />
              <motion.span
                className="w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 block"
              />
            </div>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
} 