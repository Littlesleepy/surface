/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-07 11:09:39
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-14 11:00:58
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\electron\main\index.ts
 * @Description: 
 */

import { app, BrowserWindow, shell, ipcMain, screen } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import { useIpcMain } from './useIpcMain'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

const { getWin } = useIpcMain()

async function createWindow() {
  // const primaryDisplay = screen.getPrimaryDisplay()
  // const { width, height } = primaryDisplay.workAreaSize

  win = new BrowserWindow({
    show: false,
    width: 1500,
    height: 600,
    title: '真信智能',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // 是否启用Node integration.
      nodeIntegration: false,
      // 是否在独立 JavaScript 环境中运行 Electron API和指定的preload 脚本
      contextIsolation: true
    },
    backgroundColor: 'rgb(18, 18, 18)',
    // false创建一个无边框窗口
    frame: false,
    alwaysOnTop: true
  })

  getWin(win)

  win.setMenu(null)

  // 完成资源加载再显示
  win.once('ready-to-show', () => {
    win.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
