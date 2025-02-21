import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // ✅ Load environment variables based on the current mode (development/production)
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // ✅ Ensure API URL is available in client-side code
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
    },
    server: {
      port: 443, // ✅ Change if needed
    },
    build: {
      outDir: 'dist',
    },
  };
});
