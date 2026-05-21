import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  root: '.',
  base: '/',
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
  },
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
  },
});
