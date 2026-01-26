import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow loading env vars from repo root so VITE_* in ../.env are picked up.
  envDir: '..',
})
