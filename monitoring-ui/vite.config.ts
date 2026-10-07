import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const nagiosTarget = env.VITE_NAGIOS_TARGET ?? 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // Same-origin proxy to Nagios so browsers never hit CGI CORS restrictions.
      proxy: {
        '/cgi-bin': {
          target: nagiosTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      environment: 'node',
      environmentMatchGlobs: [['src/**/*.test.tsx', 'jsdom']],
      include: ['src/**/*.test.{ts,tsx}'],
      globals: true,
    },
  };
});
