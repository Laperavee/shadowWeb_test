import { motion } from 'framer-motion';
import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Comment créer mon token avec Shadow ?",
      answer: "Il suffit de mentionner @Shadow sur Twitter ou Warpcast avec les paramètres souhaités. Par exemple : '@Shadow Crée mon token $EXEMPLE avec 1000 unités de liquidité initiale'."
    },
    {
      question: "Quelle est la liquidité minimale requise ?",
      answer: "La liquidité minimale est de 100 unités. Nous recommandons cependant une liquidité plus importante pour assurer une meilleure stabilité."
    },
    // Ajoutez d'autres FAQs
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 pb-16"
    >
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold mb-12 text-center">FAQ</h1>
        
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="mb-4"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-6 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{faq.question}</h3>
                  <span className={`transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
                
                {openIndex === index && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 text-gray-400"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
} 