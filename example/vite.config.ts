import { UserConfig } from 'vite'
import crx from "vite-plugin-crx"

const path = require('path')

function pathResolve (dir: string) {
  return path.resolve(process.cwd(), dir)
}

const viteConfig: UserConfig = {
  server: {
    port: 3050,
  },
  plugins: [
    crx({
      background: pathResolve("background/index.ts")
    })
  ],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: pathResolve("background/index.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].js"
      }
    }
  }
}

export default viteConfig
