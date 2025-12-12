import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mis-notas/', // <--- AGREGA ESTA LÍNEA (debe coincidir con el nombre de tu repo)
})