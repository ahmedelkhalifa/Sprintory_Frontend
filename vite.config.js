import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // scan only the app's page: the landing page's template in public/ has imports vite can't resolve
  optimizeDeps: { entries: ["index.html"] },
})