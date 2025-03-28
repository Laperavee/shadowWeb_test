import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { newsService } from '../services/newsService';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseContent = (content) => {
    // Créer un DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Fonction pour nettoyer et formater le texte
    const formatText = (text) => {
      return text.replace(/\s+/g, ' ').trim();
    };

    // Fonction pour créer un paragraphe stylisé
    const createStyledParagraph = (text) => {
      return `<p class="text-gray-300 text-lg leading-relaxed mb-6">${text}</p>`;
    };

    // Fonction pour créer un titre stylisé
    const createStyledHeading = (text, level) => {
      const classes = {
        h1: 'text-4xl font-bold mb-8 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400',
        h2: 'text-3xl font-semibold mt-12 mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400',
        h3: 'text-2xl font-semibold mt-8 mb-4 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400'
      };
      return `<${level} class="${classes[level]}">${text}</${level}>`;
    };

    // Fonction pour créer une liste stylisée
    const createStyledList = (items) => {
      const listItems = items.map(item => 
        `<li class="text-gray-300 text-lg leading-relaxed mb-3 pl-4 border-l-2 border-fuchsia-500">${item}</li>`
      ).join('');
      return `<ul class="space-y-4 my-8">${listItems}</ul>`;
    };

    // Traiter chaque élément
    let processedContent = '';
    doc.body.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = formatText(node.textContent);
        if (text) {
          processedContent += createStyledParagraph(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        switch (node.tagName.toLowerCase()) {
          case 'h1':
            processedContent += createStyledHeading(node.textContent, 'h1');
            break;
          case 'h2':
            processedContent += createStyledHeading(node.textContent, 'h2');
            break;
          case 'h3':
            processedContent += createStyledHeading(node.textContent, 'h3');
            break;
          case 'p':
            if (node.querySelector('strong')) {
              const strongText = node.querySelector('strong').textContent;
              const remainingText = node.textContent.replace(strongText, '').trim();
              processedContent += `<p class="text-gray-300 text-lg leading-relaxed mb-6">
                <span class="text-white font-semibold bg-gray-800/30 px-2 py-0.5 rounded">${strongText}</span>
                ${remainingText}
              </p>`;
            } else {
              processedContent += createStyledParagraph(node.textContent);
            }
            break;
          case 'ul':
            const items = Array.from(node.querySelectorAll('li')).map(li => li.textContent);
            processedContent += createStyledList(items);
            break;
        }
      }
    });

    return processedContent;
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await newsService.getPost(id);
        if (data.content) {
          data.content = parseContent(data.content);
        }
        setPost(newsService.formatNews(data));
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800/30 rounded-xl w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-800/30 rounded-xl w-3/4 mb-8"></div>
            <div className="h-96 bg-gray-800/30 rounded-xl mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-800/30 rounded-xl w-full"></div>
              <div className="h-4 bg-gray-800/30 rounded-xl w-5/6"></div>
              <div className="h-4 bg-gray-800/30 rounded-xl w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
            <p className="text-gray-400">Post not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-4"
    >
      <div className="max-w-6xl mx-auto">
        <Link 
          to="/posts"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to News
        </Link>

        <motion.article 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl"
        >
          <div className="relative h-[500px] rounded-t-2xl overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover rounded-t-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent rounded-t-2xl" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-4xl font-bold text-white mb-2">{post.title}</h1>
              <p className="text-gray-400">
                {post.created_at}
              </p>
            </div>
          </div>

          <div className="p-8">
            <div 
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {post.signature && (
              <div className="mt-12 pt-8 border-t border-gray-700/50">
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <p className="text-gray-400 text-sm font-mono break-all">
                    <span className="text-fuchsia-400 mr-2">Signature:</span>
                    {post.signature}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.article>
      </div>
    </motion.div>
  );
};

export default PostDetail; 