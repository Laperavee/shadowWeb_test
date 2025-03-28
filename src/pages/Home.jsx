import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import NewsCarousel from '../components/NewsCarousel';

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <main ref={containerRef} className="min-h-screen bg-black overflow-x-hidden">
      {/* Enhanced animated background effects */}
      <div className="fixed inset-0">        
        {/* Dynamic Glowing Orbs with random positions and animations */}
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute -top-1/4 left-1/4 w-[800px] h-[800px]"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-[150px]" />
          <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-purple-500/5 rounded-full blur-[50px]" />
        </motion.div>

        <motion.div 
          style={{ y: backgroundY }}
          className="absolute -bottom-1/4 right-1/4 w-[800px] h-[800px]"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[150px]" />
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-[50px]" />
        </motion.div>

        {/* Additional floating orbs with random movements */}
        <motion.div 
          className="absolute top-1/3 left-1/3 w-[400px] h-[400px]"
          animate={{
            x: [0, 150, 0],
            y: [0, -100, 0],
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="absolute inset-0 bg-fuchsia-500/15 rounded-full blur-[100px]" />
        </motion.div>

        <motion.div 
          className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px]"
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.25, 0.1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="absolute inset-0 bg-cyan-500/15 rounded-full blur-[100px]" />
        </motion.div>

        {/* Subtle noise texture */}
        <div className="absolute inset-0 bg-noise bg-repeat opacity-[0.15]" />
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
                Automated ERC20 token deployment with Uniswap V3 integration and cross-chain capabilities through LayerZero
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
                    document.getElementById('features').scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start',
                      duration: 2000
                    });
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

        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="container mx-auto">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Key Features
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-20 px-4 bg-black/30">
          <div className="container mx-auto">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              How It Works
            </motion.h2>
            <div className="max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="relative flex items-start gap-8 mb-12"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 flex items-center justify-center border border-fuchsia-500/20">
                    <span className="text-xl font-bold text-white">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Security Features
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-black/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
} 

const features = [
  {
    title: "Token Deployment",
    description: "Deploy ERC20 tokens with customizable parameters including name, symbol, supply, and liquidity.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    )
  },
  {
    title: "Uniswap V3 Integration",
    description: "Automatic liquidity pool creation and management with sophisticated price calculation mechanisms.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Cross-Chain Support",
    description: "Multi-chain deployment capabilities powered by LayerZero for seamless cross-chain communication.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Position Management",
    description: "Track and manage Uniswap V3 positions with automated fee collection and distribution.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Fee Management",
    description: "Sophisticated fee collection system with automated distribution to stakeholders.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    title: "Price Management",
    description: "Advanced price calculation utilities with TWAP oracle integration for accurate pricing.",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    )
  }
];

const steps = [
  {
    title: "Token Creation",
    description: "Start by configuring your token parameters including name, symbol, supply, and initial liquidity."
  },
  {
    title: "Address Prediction & Salt Generation",
    description: "The system generates a unique salt and predicts the token address to ensure Uniswap V3 compatibility."
  },
  {
    title: "Price Calculation",
    description: "Advanced algorithms calculate optimal pricing using TWAP oracles and sophisticated price management mechanisms."
  },
  {
    title: "Pool Creation",
    description: "Automatic creation and initialization of Uniswap V3 pool with calculated parameters and initial liquidity."
  },
  {
    title: "Position Management",
    description: "Track and manage your liquidity positions with automated fee collection and distribution systems."
  }
];

const securityFeatures = [
  {
    title: "Access Control",
    description: "Robust permission system with role-based access control for critical functions."
  },
  {
    title: "Atomic Transactions",
    description: "All deployment steps are atomic - if any step fails, the entire transaction reverts ensuring fund safety."
  },
  {
    title: "Parameter Validation",
    description: "Comprehensive parameter validation and security checks before any operation."
  },
  {
    title: "Anti-Sniper Protection",
    description: "Advanced salt generation mechanism to prevent front-running and sniping attacks."
  }
]; 