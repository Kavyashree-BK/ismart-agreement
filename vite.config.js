import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
    base: '/ismart-agreement/',
  plugins: [
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Make sure 'src' is the correct directory
    },
  },
});


