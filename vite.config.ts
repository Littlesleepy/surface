/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-07 11:09:39
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-09 09:52:02
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\vite.config.ts
 * @Description: 
 */
import { rmSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
// import renderer from 'vite-plugin-electron-renderer'
import pkg from './package.json'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    plugins: [
      vue(),
      electron([
        {
          // Main-Process entry file of the Electron App.
          entry: 'electron/main/index.ts',
          onstart(options) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
            } else {
              options.startup()
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        {
          entry: 'electron/preload/index.ts',
          onstart(options) {
            // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
            // instead of restarting the entire Electron App.
            options.reload()
          },
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        }
      ]),
      // Use Node.js API in the Renderer-process
      // renderer({
      //   nodeIntegration: true,
      // }),
    ],
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
      return {
        host: url.hostname,
        port: +url.port,
      }
    })(),
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src/')
        },
        {
          find: 'theme',
          replacement: path.resolve(__dirname, 'src/assets/styles/theme.less')
        },
        {
          find: 'views',
          replacement: path.resolve(__dirname, 'src/views')
        },
        {
          find: 'store',
          replacement: path.resolve(__dirname, 'src/store')
        },
        {
          find: 'cp',
          replacement: path.resolve(__dirname, 'src/components')
        },
        {
          find: 'images',
          replacement: path.resolve(__dirname, 'src/assets/images')
        },
        {
          find: 'helper',
          replacement: path.resolve(__dirname, 'src/helper')
        },
        {
          find: 'types',
          replacement: path.resolve(__dirname, 'src/types')
        },
        {
          find: 'storage',
          replacement: path.resolve(__dirname, 'src/storage')
        },
        {
          find: 'mcharts',
          replacement: path.resolve(__dirname, 'src/packages')
        }
      ]
    },
    clearScreen: false,
  }
})
