import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  const links = {
    product: [
      { name: 'Platform', path: '/platform' },
      { name: 'Features', path: '/features' },
      { name: 'How it Works', path: '/how-it-works' },
    ],
    social: [
      { name: 'Twitter', url: 'https://x.com/shadowagentbot' },
      { name: 'Discord', url: 'https://discord.gg/shadow' },
      { name: 'Telegram', url: 'https://telegram.org' },
    ]
  };

  return (
    <footer className="absolute bottom-0 w-full z-10 bg-transparent">
      <div className="container mx-auto px-4 py-12 bg-transparent">
        <div className="flex flex-col md:flex-row justify-between">
          {/* Brand */}
          <div>
            <Link to="/" className="text-2xl font-bold interactive">
              <motion.span 
                className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400"
                whileHover={{ scale: 1.05 }}
              >
                SHADOW
              </motion.span>
            </Link>
            <p className="mt-4 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/60 to-cyan-400/60">
              The future of social tokens.
            </p>
          </div>

          {/* Product Links */}
          <div className="mt-8 md:mt-0">
            <h3 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Product
            </h3>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className="interactive group"
                  >
                    <motion.span
                      className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/80 to-cyan-400/80 group-hover:from-fuchsia-400 group-hover:to-cyan-400"
                      whileHover={{ scale: 1.05 }}
                    >
                      {link.name}
                    </motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="mt-8 md:mt-0">
            <h3 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Community
            </h3>
            <ul className="space-y-2">
              {links.social.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="interactive group"
                  >
                    <motion.span
                      className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/80 to-cyan-400/80 group-hover:from-fuchsia-400 group-hover:to-cyan-400"
                      whileHover={{ scale: 1.05 }}
                    >
                      {link.name}
                    </motion.span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 text-center">
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/50 to-cyan-400/50">
            © 2024 Shadow Protocol. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 