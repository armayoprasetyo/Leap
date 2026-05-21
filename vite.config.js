import { defineConfig } from 'vite';

export default defineConfig({
  // Use the project root as base
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
  // Ensure Vite handles the 'require' references gracefully
  define: {
    'process.env': {},
  },
  // Optimise the supabase dep
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
  },
});
