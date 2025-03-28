import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import NewsCarousel from '../components/NewsCarousel';

const Home = () => {
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 200]);

  return (
    <main className="min-h-screen">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-grid-animation bg-grid-size opacity-5" style={{ backgroundPosition: 'center' }} />
         
         {/* Dynamic Glowing Orbs */}
         <motion.div 
           style={{ y: backgroundY }}
           className="absolute -top-1/4 left-1/4 w-[800px] h-[800px]"
         >
           <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-[150px] animate-pulse" />
           <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-300" />
           <div className="absolute inset-0 bg-purple-500/5 rounded-full blur-[50px] animate-pulse delay-700" />
         </motion.div>
 
         <motion.div 
           style={{ y: backgroundY }}
           className="absolute -bottom-1/4 right-1/4 w-[800px] h-[800px]"
         >
           <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[150px] animate-pulse delay-500" />
           <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
           <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-[50px] animate-pulse delay-1000" />
         </motion.div>
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400">
                Shadow Protocol
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
            >
              Create and trade tokens with advanced features and real-time analytics
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/shadow-fun"
                className="relative px-8 py-4 rounded-xl group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-50 group-hover:opacity-70 transition-opacity rounded-xl" />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <div className="relative flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-white font-semibold">
                    Launch App
                  </span>
                </div>
              </Link>
              <Link
                to="/how-it-works"
                className="relative px-8 py-4 rounded-xl group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-500 opacity-20 group-hover:opacity-40 transition-opacity rounded-xl" />
                <div className="relative flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-white font-semibold">
                    Learn More
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* News Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
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
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-4">
                Features
              </h2>
              <p className="text-gray-400">
                Discover what makes Shadow Protocol unique
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 + index * 0.2 }}
                  className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-fuchsia-500/50 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-fuchsia-500/20 rounded-xl flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

const features = [
  {
    title: "Token Creation",
    description: "Create your own tokens with advanced features and customizable parameters",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Real-time Analytics",
    description: "Track token performance with detailed charts and market insights",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Secure Trading",
    description: "Trade tokens safely with built-in security features and smart contract audits",
    icon: (
      <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
];

export default Home; 