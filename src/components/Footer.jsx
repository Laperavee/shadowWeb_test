import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black/30 backdrop-blur-sm border-t border-fuchsia-500/10 py-2 text-center text-xs">
      <p className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400/40 to-cyan-400/40">
        © 2024 Shadow Protocol
      </p>
    </footer>
  );
} 