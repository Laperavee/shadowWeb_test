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
    <main ref={containerRef} className="min-h-screen bg-black overflow-x-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-blue-500/10" />
        
        {/* Animated orbs */}
        {isVisible && (
          <>
            <motion.div 
              style={{ y: backgroundY }}
              className="absolute -top-1/4 left-1/4 w-[800px] h-[800px]"
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, 30, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-[100px]" />
            </motion.div>

            <motion.div 
              style={{ y: backgroundY }}
              className="absolute -bottom-1/4 right-1/4 w-[800px] h-[800px]"
              animate={{
                opacity: [0.1, 0.25, 0.1],
                scale: [1, 1.2, 1],
                x: [0, -50, 0],
                y: [0, -30, 0]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-[100px]" />
            </motion.div>

            <motion.div 
              className="absolute top-1/2 left-1/2 w-[600px] h-[600px]"
              animate={{
                opacity: [0.05, 0.2, 0.05],
                scale: [1, 1.3, 1],
                x: [0, 30, 0],
                y: [0, -20, 0]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="absolute inset-0 bg-fuchsia-500/30 rounded-full blur-[100px]" />
            </motion.div>

            <motion.div 
              className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px]"
              animate={{
                opacity: [0.05, 0.25, 0.05],
                scale: [1, 1.2, 1],
                x: [0, -30, 0],
                y: [0, 20, 0]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-[100px]" />
            </motion.div>
          </>
        )}

        {/* Scanner effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,0,255,0.05),transparent)] animate-scanner-slow" />
        
        {/* Noise texture */}
        <div className="absolute inset-0 bg-noise bg-repeat opacity-[0.1]" />
      </div>

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

        {/* News Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-4">
                Latest News
              </h2>
              <p className="text-gray-400">
                Stay updated with the latest developments in the Shadow Protocol ecosystem
              </p>
            </motion.div>

            <NewsCarousel />
          </div>
        </section>
      </div>
    </main>
  );
} 