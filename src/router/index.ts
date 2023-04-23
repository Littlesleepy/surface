/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-21 11:17:11
 * @FilePath: \zxi-surface\src\router\index.ts
 * @Description:
 */
import { createRouter, RouterOptions, createWebHashHistory, RouteRecordRaw, Router } from 'vue-router'

declare module "vue-router" {
  interface RouteMeta {
    title: string;
    functionKey?: string;
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: "",
    redirect: "/Load",
  },
  {
    path: "/Load",
    name: "Load",
    meta: { title: "加载中" },
    component: () => import("views/Load/Load.vue"),
  },
  {
    path: "/SingleMeasure",
    name: "SingleMeasure",
    meta: { title: "单频测量" ,functionKey:'SingleMeasure'},
    component: () => import("views/SingleMeasure/SingleMeasure.vue"),
  },
  {
    path: "/PScan",
    name: "PScan",
    meta: { title: "全景扫描" ,functionKey:'PScan'},
    component: () => import("views/PScan/PScan.vue"),
  },
  {
    path: "/CIQStream",
    name: "CIQStream",
    meta: { title: "信号多域分析" ,functionKey:'CIQStream'},
    component: () => import("views/CIQStream/CIQStream.vue"),
  },
  {
    path: "/XScan",
    name: "XScan",
    meta: { title: "高精度扫描" ,functionKey:'XScan'},
    component: () => import("views/XScan/XScan.vue"),
  },
  {
    path: "/SignalRecognitionAnalysis",
    name: "SignalRecognitionAnalysis",
    meta: { title: "信号特征分析" ,functionKey:'SignalRecognitionAnalysis'},
    component: () => import("@/views/SignalRecognitionAnalysis/SignalRecognitionAnalysis.vue"),
  },
  {
    path: "/DPX",
    name: "DPX",
    meta: { title: "数字荧光谱" ,functionKey:'DPX'},
    component: () => import("views/DPX/DPX.vue"),
  },
  {
    path: '/SA',
    name: 'SA',
    meta: { title:'数字信号解调', functionKey: 'SA' },
    component: () => import('views/SA/SA.vue')
  },
  {
    path: "/HandheldSingleMeasure",
    name: "HandheldSingleMeasure",
    meta: { title: "手持式天线测量" ,functionKey:'HandheldSingleMeasure'},
    component: () => import("views/HandheldSingleMeasure/HandheldSingleMeasure.vue"),
  },
];

const options: RouterOptions = {
  history: createWebHashHistory(),
  routes,
};

const router: Router = createRouter(options);

export default router;
