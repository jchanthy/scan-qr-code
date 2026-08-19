import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const securityHeaders = {
  'Access-Control-Allow-Origin': 'https://scan.reandigitalkh.com',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
};

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: securityHeaders,
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
        headers: securityHeaders,
      },
      plugins: [
        tailwindcss(),
        react()
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
    };
});

