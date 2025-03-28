import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { netlifyApi } from '../utils/netlify-api';

const NewsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await netlifyApi.getNews();
        console.log('News data:', data);
        const latestNews = data.slice(0, 3);
        setNews(latestNews);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === news.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? news.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [news.length]);

  if (loading) {
    return (
      <div className="relative h-[400px] bg-gray-800 rounded-2xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative h-[400px] bg-red-500/10 border border-red-500/20 rounded-2xl">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!news.length) {
    return null;
  }

  return (
    <div className="relative h-[400px] bg-gray-800 rounded-2xl">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-2xl"
        >
          <Link to={`/post/${news[currentIndex].id}`} className="block h-full">
            <div className="relative h-full rounded-2xl">
              <img
                src={news[currentIndex].image}
                alt={news[currentIndex].title}
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent rounded-2xl" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-2xl font-bold text-white mb-2">{news[currentIndex].title}</h2>
                <p className="text-gray-300 mb-4">{news[currentIndex].description}</p>
                <p className="text-gray-400">
                  {new Date(news[currentIndex].created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-900/80 hover:bg-gray-900 text-white transition-colors"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-900/80 hover:bg-gray-900 text-white transition-colors"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {news.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default NewsCarousel; 