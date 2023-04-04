<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-02 16:01:06
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-15 11:26:09
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\views\Load\Load.vue
 * @Description: 
 -->

<script setup lang="ts">
import zxilogo from 'images/ZXI_Logo.png'
import loading from 'images/loading.gif'
import { Axios, SignalR, Hub } from '@/server'
import { localStorageKey, localCache } from '@/storage'
import { ElNotification } from 'element-plus'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { UseTheme } from 'mcharts/index'

const router = useRouter()

const progress = ref('身份验证中')

// 先登录获取token
function login (): void {
  Axios({
    method: 'post',
    url: '/api/User/login',
    data: Config.authentication
  }).then((msg) => {
    if (msg.status === 200) {
      // 存储token
      localStorage.setItem(localStorageKey.KEY_USER_TOKEN, JSON.stringify(msg.data.token))
      // 存储账号和密码
      localStorage.setItem(localStorageKey.KEY_USER_LOGIN, JSON.stringify(Config.authentication))
      // 获取设备功能和参数
      progress.value = '初始化设备'
      setTimeout(() => {
        localCache().then(s => {
          if (s) {
            progress.value = '完成'
            setTimeout(() => {
              router.push({ name: 'SingleMeasure' })
            }, 1000)
          } else {
            progress.value = '初始化设备失败'
          }
        })
      }, 1500)
      
    }
  }).catch(() => {
    progress.value = '授权失败'
    ElNotification({ type: 'error', message: '账号或密码输入错误', title: '登陆失败' })
  })
}

setTimeout(() => {
  login()
}, 1000)

</script>

<template>
  <div class="container">
    <BaseTopFrame />
    <div class="wrapper">
      <img class="logo" :src="zxilogo">
      <img class="loading" :src="loading">
    </div>
    <div class="progress">
      <p>{{ progress }}</p>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('theme');
.container{
  width: 100%;
  height: 100%;
  background-color: v-bind('UseTheme.theme.var.backgroundColor');
  color: v-bind('UseTheme.theme.var.color');
  display: flex;
  position: relative;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  display: flex;
  flex-direction: column;
  .wrapper{
    margin: auto;
    display: flex;
    .logo{
      margin: auto 0;
      height: 30vh;
    }
    .loading{
      margin: calc(30vh - 50px) 0 0 5px;
      height: 40px;
    }
  }
  .progress{
    position: absolute;
    right: 20px;
    bottom:10px;
    font-size: 1.8rem;
  }
}
</style>