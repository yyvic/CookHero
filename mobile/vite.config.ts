import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 移动端部署在站点的 /m/ 子路径下（nginx 把 /m/ 指向本项目的 dist），
// 与桌面版共用同一个端口，API 走同源 /api/v1。
export default defineConfig({
  base: '/m/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
