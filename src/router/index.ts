/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-10-09 14:55:45
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-15 17:15:21
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\router\index.ts
 * @Description: 
 */
import { createRouter, RouterOptions, createWebHashHistory, RouteRecordRaw, Router } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    functionKey?: string
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    redirect: '/Load'
  },
  {
    path: '/Load',
    name: 'Load',
    meta: { title:'加载中' },
    component: () => import('views/Load/Load.vue')
  },
  {
    path: '/SingleMeasure',
    name: 'SingleMeasure',
    meta: { title:'单频测量' },
    component: () => import('views/SingleMeasure/SingleMeasure.vue')
  },
  {
    path: '/PScan',
    name: 'PScan',
    meta: { title:'全景扫描' },
    component: () => import('views/PScan/PScan.vue')
  }
]

const options: RouterOptions = {
  history: createWebHashHistory(),
  routes
}

const router: Router = createRouter(options)

export default router