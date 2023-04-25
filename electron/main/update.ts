/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-24 16:29:12
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-25 15:57:48
 * @FilePath: \zxi-surface\electron\main\update.ts
 * @Description:
 */
import { dialog } from "electron";
import { autoUpdater } from "electron-updater";
import logger from "electron-log";
import { setConfig } from "./setCongig";


// autoUpdater.autoInstallOnAppQuit = false;
export function update(win) {
  autoUpdater.setFeedURL({
    provider: "generic",
    url: "http://127.0.0.1:8080/release/2.0.0"
  })
  // 自动下载更新
  autoUpdater.autoDownload = true
  // 退出后自动更新
  autoUpdater.autoInstallOnAppQuit = false
  // 开始检查更新
  autoUpdater.checkForUpdates().then((update) => {
    logger.info(update);
  });
  autoUpdater.on("checking-for-update", () => {
    logger.info("正在检查更新……");
  });
  autoUpdater.on("update-available", (ev) => {
    // 更新前备份config
    setConfig(true)
    logger.info("下载更新包成功");
  });
  autoUpdater.on("update-not-available", (ev) => {
    // 更新后恢复config
    setConfig(false)
    logger.info("当前版本已是最新版本");
  });
  autoUpdater.on("error", (ev, err) => {
    logger.info("检查更新出错");
    logger.info(ev);
    logger.info(err);
    dialog.showMessageBox({title:'error',message:String(err)})
  });
  autoUpdater.on("download-progress", (ev) => {
    logger.info("正在下载...");
  });
  autoUpdater.on("update-downloaded", (ev) => {
    logger.info("下载完成，更新开始...");
    const options = {
      type: "info",
      buttons: ["确定", "取消"],
      title: "应用更新",
      message: '',
      detail: "发现有新版本，是否更新?",
    };
    dialog.showMessageBox(options).then((returnVal) => {
      if (returnVal.response === 0) {
        logger.info("开始更新");
        setTimeout(() => {
          autoUpdater.quitAndInstall(true,true);
        }, 5000);
      } else {
        logger.info("取消更新");
        return;
      }
    });
  });
  autoUpdater.on('download-progress',(progressObj)=>{
    // 下载进度
    // let info = {
    //   bytesPerSecond: progressObj.bytesPerSecond,
    //   percent: progressObj.percent,
    //   transferred: progressObj.transferred,
    //   total: progressObj.total
    // }
    win.webContents.send('downloadProgress', progressObj)
  })

}
