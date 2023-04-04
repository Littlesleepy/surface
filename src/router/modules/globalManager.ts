/**
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-30 09:13:58
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2022-12-30 17:14:01
 * @FilePath: \zxi-device\src\router\modules\globalManager.ts
 * @Description: 全域管理
 */
export default {
  path: '/GlobalManager',
  redirect: '/GlobalManager/SystemSetting',
  name: 'GlobalManager',
  component: () => import('views/GlobalManager/GlobalManager.vue'),
  children: [{
    path: 'CacheParams',
    name: 'CacheParams',
    component: () => import('@/views/GlobalManager/Cache/CacheParams.vue'),
    meta: {
      title: '参数模板'
    }
  }, {
    path: 'CacheExport',
    name: 'CacheExport',
    component: () => import('@/views/GlobalManager/Cache/CacheExport.vue'),
    meta: {
      title: '导入/导出'
    }
  }, {
    path: 'SystemSetting',
    name: 'SystemSetting',
    component: () => import('@/views/GlobalManager/SystemSetting/SystemSetting.vue'),
    meta: {
      title: '系统设置'
    }
  }]
}
