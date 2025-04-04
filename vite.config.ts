import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    historyApiFallback: true,
    open: true
  },
  preview: {
    port: 5173,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
