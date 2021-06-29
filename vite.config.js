import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
    // host: 'https://newlivewap.ofweek.com/',
    https: true,
    proxy: {
      '/web': {
        target: 'https://livetest.ofweek.com/api',
        changeOrigin: true,
        rewrite: path => path
      },
      '/uploadImg': {
        target: 'https://livetest.ofweek.com/api/fileremote',
        changeOrigin: true,
        rewrite: path => path
      }
    }
  }
})
