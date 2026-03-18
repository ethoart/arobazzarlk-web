
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      allowedHosts: true,
    },
    define: {
      // Correctly map process.env to the actual environment variables during build
      'process.env': {
        API_KEY: JSON.stringify(env.API_KEY),
        REACT_APP_API_URL: JSON.stringify(env.REACT_APP_API_URL),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
        // Explicitly exposing Pinata keys if needed in legacy ways, but import.meta.env is preferred in Vite
      },
      // Polyfill for some libs that expect global process
      'global': 'window',
    }
  };
});
