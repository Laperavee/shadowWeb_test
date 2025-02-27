/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'gradient-slow': 'gradient 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            opacity: 1,
            filter: 'drop-shadow(0 0 15px rgba(255, 0, 255, 0.5))'
          },
          '50%': { 
            opacity: 0.8,
            filter: 'drop-shadow(0 0 25px rgba(255, 0, 255, 0.8))'
          },
        },
      },
      boxShadow: {
        'neon': '0 0 15px rgba(255, 0, 255, 0.5)',
        'neon-strong': '0 0 25px rgba(255, 0, 255, 0.8)',
      },
    },
  },
  plugins: [],
} 