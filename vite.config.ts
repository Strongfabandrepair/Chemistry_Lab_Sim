import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', '.arena.site'],
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', '.arena.site'],
  },
});
