import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import NewsCarousel from '../components/NewsCarousel';
import Navbar from '../components/Navbar';

export default function Home() {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <main ref={containerRef} className="h-screen overflow-hidden">
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 py-20">
          <div className="container mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.h1 
                className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Shadow Protocol
              </motion.h1>
              <motion.p 
                className="text-xl text-gray-400 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Automated ERC20 token deployment with Uniswap V3 integration
              </motion.p>
              <motion.div 
                className="flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  onClick={() => window.location.href = '/shadow-fun'}
                  className="bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 border border-fuchsia-400/20 px-6 py-2 rounded-xl hover:border-fuchsia-400/50 transition-all interactive relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                    Launch App
                  </span>
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/how-it-works';
                  }}
                  className="bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 border border-fuchsia-400/20 px-6 py-2 rounded-xl hover:border-fuchsia-400/50 transition-all interactive relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                    Learn More
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
} 