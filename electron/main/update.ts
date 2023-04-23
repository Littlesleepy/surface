import { autoUpdater } from "electron-updater";

let mainWindow = null;
export function update(url: string) {
  autoUpdater.checkForUpdates().then((update)=>{
    console.log(update);
    
  });
  autoUpdater.autoDownload = false;
  
  autoUpdater.on("error", (error) => {
    console.log(error,'error!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!:',error);
    
  });
  //当有可用更新的时候触发。 更新将自动下载。
  autoUpdater.on("update-available", (info) => {
    autoUpdater.downloadUpdate();
    console.log(info,'info!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
  });
  //当没有可用更新的时候触发。
  autoUpdater.on("update-not-available", () => {
    console.log('????????????????????');
    
  });
  // autoUpdater.downloadUpdate()
}
