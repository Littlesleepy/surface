/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-06 10:25:56
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-04-20 14:09:37
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\electron\main\useIpcMain.ts
 * @Description: 
 */
import path, { join } from "path";
import { app, BrowserWindow, ipcMain, IpcMainEvent, session } from "electron";
import fs from "fs";
import { PreloadName } from "../preload/useElectronAPI";
const { spawn } = require("child_process");
let ipcMainWin: BrowserWindow | null;
/**
 * @description: 使用ipcMain进行通行
 * @return {*}
 */
export function useIpcMain() {
  // 监听render读取配置文件命令并返给render
  ipcMain.handle(PreloadName.readConfig, useConfig);
  // 监听render设置app的状态命令
  ipcMain.on(PreloadName.controlApp, controlApp);
  // 监听浏览器打开调试窗口命令
  ipcMain.on(PreloadName.toggleDevTools, toggleDevTools);
  ipcMain.on(PreloadName.cleanCache, () => {
    ipcMainWin.webContents.session.clearCache().then(() => {
      app.relaunch()
      app.exit()
    });
  });

  return {
    getWin(win: BrowserWindow) {
      ipcMainWin = win;
    },
  };
}


/**
 * @description: 读取配置文件
 * @return {Promise<string>}
 */
async function useConfig() {
  let filePath = "";
  if (!app.isPackaged) {
    // 生产环境
    const appDir = app.getPath('exe')
    filePath = join(path.dirname(appDir), 'config.json')
  } else {
    filePath = join(process.env.PUBLIC, "config.json");
  }

  return fs.readFileSync(filePath, "utf-8");
}

/**
 * @description: 控制APP最小化、最大化、关闭
 * @param {IpcMainEvent} e
 * @param {*} status 想要设置的状态
 * @return {*}
 */
function controlApp(e: IpcMainEvent, status: "min" | "max" | "close") {
  switch (status) {
    case "min":
      if (ipcMainWin) ipcMainWin.minimize();
      break;
    case "max":
      {
        if (ipcMainWin.isFullScreen()) {
          ipcMainWin.setFullScreen(false);
        } else {
          ipcMainWin.setFullScreen(true);
        }
      }
      break;
    case "close":
      app.exit();
      break;
  }
}

function toggleDevTools() {
  if (ipcMainWin) {
    if (ipcMainWin.webContents.isDevToolsOpened()) {
      ipcMainWin.webContents.closeDevTools();
    } else {
      ipcMainWin.webContents.openDevTools();
    }
  }
}
