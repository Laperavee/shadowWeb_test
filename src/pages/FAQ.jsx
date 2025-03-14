import { motion } from 'framer-motion'; 
import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How to create my token with Shadow?",
      answer: "Simply mention @Shadow on Twitter or Warpcast with your desired parameters. For example: '@Shadow Create my token $EXAMPLE with 1000 initial liquidity units'."
    },
    {
      question: "What is the minimum required liquidity?",
      answer: "The minimum liquidity is 100 units. However, we recommend higher liquidity to ensure better stability."
    },
    // Add other FAQs
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