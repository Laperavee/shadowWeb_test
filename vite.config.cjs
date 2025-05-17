const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

module.exports = defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  define: {
    'process.env': process.env
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber']
  }
}) 