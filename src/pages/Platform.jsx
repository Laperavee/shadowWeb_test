import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Tweet } from 'react-tweet';

const formatNumber = (num) => {
  if (!num) return 'N/A';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Ajoutez cette fonction pour copier le texte
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

export default function Platform() {
  const containerRef = useRef(null);
  const [selectedTab, setSelectedTab] = useState('latest');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validTweets, setValidTweets] = useState(new Set());
  const [filteredItems, setFilteredItems] = useState([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .order('mentioned_at', { ascending: false });

      if (error) {
        console.error('Error while fetching data:', error);
        setError(error.message);
      } else {
        setItems(data);
        filterItems(data, selectedTab);
      }
      setLoading(false);
    };

    fetchItems();
  }, []);

  const filterItems = (data, tab) => {
    let filtered = data;
    switch(tab) {
      case 'trending':
        filtered = data;
        break;
      case 'verified':
        filtered = data;
        break;
      default:
        filtered = data;
    }
    setFilteredItems(filtered);
  };

  useEffect(() => {
    filterItems(items, selectedTab);
  }, [selectedTab, items]);

  // Fonction pour gérer les tweets non trouvés
  const handleTweetError = (tweetId) => {
    setValidTweets(prev => {
      const newSet = new Set(prev);
      newSet.delete(tweetId);
      return newSet;
    });
  };

  // Quand les données sont chargées, initialiser validTweets
  useEffect(() => {
    if (items.length > 0) {
      setValidTweets(new Set(items.map(item => item.tweet_response_id)));
    }
  }, [items]);

  return (
    <main ref={containerRef} className="bg-black min-h-screen">
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
      </div>

      <div className="min-h-screen pt-20 pb-16 relative">
        <div className="container mx-auto px-4">
          {/* Titre et description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400">
              Latest Launches
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover the most recent token launches powered by Shadow Protocol
            </p>
          </motion.div>

          {/* Tabs de filtrage */}
          <div className="flex justify-center mb-16">
            <div className="flex gap-2 p-1 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-800">
              {['latest', 'trending', 'verified'].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`
                    px-6 py-2.5 rounded-lg
                    transition-all duration-300
                    ${selectedTab === tab 
                      ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/50' 
                      : 'hover:bg-gray-800/50'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={`
                    text-sm font-medium
                    ${selectedTab === tab
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400'
                      : 'text-gray-400 hover:text-gray-300'
                    }
                  `}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* État de chargement */}
          {loading && (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500"></div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="text-red-500 text-center py-8">
              Error: {error}
            </div>
          )}

          {/* Liste des items */}
          {!loading && !error && (
            <div className="grid gap-8 max-w-3xl mx-auto">
              {filteredItems.map((item, index) => {
                // Ne pas afficher si le tweet n'est pas dans validTweets
                if (!validTweets.has(item.tweet_response_id)) {
                  return null;
                }

                const dexscreenerLink = item.tweet_response_text.match(/https:\/\/dexscreener[^\s]*/)?.[0];

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-fuchsia-500/50 transition-all duration-300"
                  >
                    <div className="flex flex-col gap-6">
                      {/* Container pour l'embed et les paramètres */}
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Tweet Embed */}
                        <div className="w-full md:w-2/3 overflow-hidden rounded-xl">
                          <Tweet 
                            id={item.tweet_response_id} 
                            theme="dark" 
                            data-theme="dark"
                            onError={() => handleTweetError(item.tweet_response_id)}
                          />
                        </div>

                        {/* Paramètres du contrat */}
                        <div className="w-full md:w-1/3 p-4 bg-black/20 rounded-xl border border-gray-800">
                          <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                            Contract Details
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-gray-400 text-sm">Contract Address:</p>
                              <div className="flex items-center gap-2 mt-1 group">
                                <p className="font-mono text-sm text-fuchsia-400/80 break-all">
                                  {item.contract_address}
                                </p>
                                <motion.button
                                  onClick={async () => {
                                    const success = await copyToClipboard(item.contract_address);
                                    if (success) {
                                      console.log('Copied!');
                                    }
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-1 rounded-md hover:bg-gray-800/50 transition-colors"
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-4 w-4 text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                                    />
                                  </svg>
                                </motion.button>
                              </div>
                            </div>
                            <div>
                              <p className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 text-sm font-medium">
                                Liquidity:
                              </p>
                              <p className="font-medium text-white">
                                {item.liquidity ? `${item.liquidity} ETH` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 text-sm font-medium">
                                Max Percentage:
                              </p>
                              <p className="font-medium text-white">
                                {item.max_percentage ? `${item.max_percentage}%` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 text-sm font-medium">
                                Supply:
                              </p>
                              <p className="font-medium text-white">
                                {formatNumber(item.supply)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bouton Chart */}
                      {dexscreenerLink && (
                        <div className="flex justify-end mt-2">
                          <motion.a
                            href={dexscreenerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 border border-fuchsia-500/20 hover:border-fuchsia-500/50 transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-medium">
                              View Chart →
                            </span>
                          </motion.a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 