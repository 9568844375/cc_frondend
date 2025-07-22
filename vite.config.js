import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173, // Change this to 5173 or any other port you prefer
  },
  plugins: [react()],
})
