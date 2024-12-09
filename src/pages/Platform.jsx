import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';

export default function Platform() {
  const containerRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('latest');
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const tweets = [
    {
      id: 1,
      text: "New token launched: $EXAMPLE",
      timestamp: "2024-01-20T12:00:00Z",
      twitterLink: "https://x.com/example/status/123",
      dexscreenerLink: "https://dexscreener.com/ethereum/0x123...",
    },
    // Ajoutez plus de tweets pour tester
  ];

  return (
    <main ref={containerRef} className="bg-black">
      {/* Background qui s'étend sur toute la page */}
      <div className="fixed inset-0">
        <div className="grid-animation opacity-5" />
        
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
        
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(137,87,255,0.05)_50%,transparent_100%)] animate-scanner" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(59,130,246,0.05)_50%,transparent_100%)] animate-scanner-reverse" />
        </div>

        <div className="absolute inset-0 bg-noise opacity-5" />
      </div>

      <div className="min-h-screen pt-20 pb-16 relative">
        <div className="container mx-auto px-4">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-block mb-8 px-6 py-3 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/5 backdrop-blur-sm"
            >
              <span className="text-fuchsia-400 font-mono relative">
                <span className="absolute -inset-0.5 bg-fuchsia-500/20 blur-sm rounded-full animate-pulse" />
                <span className="relative">SHADOW TRACKER v1.0</span>
              </span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight relative">
              <span className="relative inline-block">
                <span className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 blur-xl" />
                <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 animate-gradient">
                  Token Tracker
                </span>
              </span>
            </h1>
            <p className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/90 to-cyan-400/90">
              Track the latest social tokens and their performance
            </p>
          </motion.div>

          {/* Onglets améliorés */}
          <div className="flex justify-center mb-12 space-x-6">
            {['latest', 'trending', 'verified'].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-8 py-3 rounded-lg backdrop-blur-sm relative overflow-hidden group ${
                  selectedTab === tab 
                    ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/50' 
                    : 'bg-gray-900/30 border border-gray-800'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 capitalize font-medium">
                  {tab}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Liste des tokens améliorée */}
          <div className="grid gap-6 max-w-4xl mx-auto">
            {tweets.map((tweet, index) => (
              <motion.div
                key={tweet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-fuchsia-500/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-medium">
                      {tweet.text}
                    </p>
                    <p className="text-sm text-fuchsia-400/60 mt-2 font-mono">
                      {new Date(tweet.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <motion.a
                      href={tweet.twitterLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all duration-300 group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-medium">
                        View Tweet →
                      </span>
                    </motion.a>
                    <motion.a
                      href={tweet.dexscreenerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all duration-300 group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-medium">
                        Chart →
                      </span>
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 