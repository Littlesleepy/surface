/**
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-25 11:22:51
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-25 15:46:13
 * @FilePath: \zxi-surface\electron\main\setCongig.ts
 * @Description: 
 */
import { useConfig } from "./useIpcMain";
import { join, dirname } from "path";
import { readFile, mkdir, writeFile, readFileSync, unlink } from "fs";
import { app } from "electron";



// 获取config.json
/**
 * @returns 获取安装路径
 */
function getExePath() {
  return dirname(app.getPath("userData"));
}
/**
 * @returns 获取配置文件路径
 */
function getConfigPath() {
  return `${getExePath()}\\pm360`;
}
/**
 * @returns 读取配置文件
 */
/**
 * @returns 设置config
 */
export function setConfig(update: boolean) {
  // 
  const URL = `${getConfigPath()}\\User`;
  const CONFIG_URL = `${getConfigPath()}\\User\\config.json`;
  // 保存本地config
  // 读取config
  useConfig().then((configText) => {
    let config = JSON.parse(configText);
    // 更新前 备份config到外部
    if (update) {
      mkdir(URL, { recursive: true }, () => {
        writeFile(CONFIG_URL, configText, () => {});
      });
    } else {
      // 更新后 读取备份 config 覆盖至本地 config
      readFile(CONFIG_URL, "utf-8", (err, configCopyText) => {
        if (configCopyText) {
          let configCopy = JSON.parse(configCopyText);
          // 旧配置全部保留
          // copyValueFromObject(config, configCopy);
          // 仅保留baseurl
          config.baseUrl = configCopy.baseUrl

          let filePath = "";
          if (app.isPackaged) {
            // 生产环境
            const appDir = app.getPath("exe");
            filePath = join(dirname(appDir), "config.json");
          } else {
            filePath = join(process.env.PUBLIC, "config.json");
          }

          writeFile(filePath, JSON.stringify(config,null,2), () => {
            unlink(CONFIG_URL,()=>{

            })
          });
        }
      });
    }
  });
}


function copyValueFromObject(
  target: { [p: string]: any },
  source: { [p: string]: any }
) {
  for (const prop in source) {
    const value = source[prop];
    console.log(prop);

    if (prop in target) {
      const type = Object.prototype.toString.call(value);
      if (type === "[object Object]") {
        const targetValue = target[prop];

        if (targetValue !== undefined) {
          copyValueFromObject(targetValue, value);
        } else {
          target[prop] = value;
        }
      } else {
        target[prop] = value;
      }
    }
  }
}
