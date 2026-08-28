import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Gateway: https://wajcsa99fc.execute-api.af-south-1.amazonaws.com/v1 (stage v1)
// Cognito: af-south-1_d2nFLYfwU / 3jrv9m1l2o6iqjiq8qhg8tsj48
// Amplify v6 requires global -> globalThis shim
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    // Proxy for local dev to avoid CORS when VITE_API_URL is Gateway
    proxy: {
      // When VITE_API_URL=/api/v1, proxy to local backend
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
      // Direct proxy for Gateway stage (optional: use /v1 during dev)
      '/v1': {
        target: 'https://wajcsa99fc.execute-api.af-south-1.amazonaws.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
