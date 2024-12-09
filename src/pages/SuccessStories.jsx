import { motion } from 'framer-motion';

export default function SuccessStories() {
  const stories = [
    {
      name: "CryptoArt DAO",
      token: "$ART",
      description: "Une communauté d'artistes qui a tokenisé leur marketplace NFT.",
      stats: {
        holders: "1.2k",
        volume: "$500k",
        growth: "+300%"
      }
    },
    // Ajoutez d'autres success stories
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 pb-16"
    >
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12 text-center">Success Stories</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {stories.map((story, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.2 }}
              className="bg-gray-900/50 p-8 rounded-lg"
            >
              <h2 className="text-2xl font-bold mb-4">{story.name}</h2>
              <p className="text-purple-500 mb-4">{story.token}</p>
              <p className="text-gray-400 mb-6">{story.description}</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Holders</p>
                  <p className="text-xl font-bold">{story.stats.holders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Volume</p>
                  <p className="text-xl font-bold">{story.stats.volume}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Croissance</p>
                  <p className="text-xl font-bold text-green-500">{story.stats.growth}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
} 