<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-08 14:53:38
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-22 15:22:58
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\BaseTopFrame\BaseTopFrame.vue
 * @Description: 
 -->
<script lang="ts">
export default {
  name: 'BaseTopFrame'
}
</script>
<script setup lang="ts">import { ElMessage, ElMessageBox } from 'element-plus';

function setMinMaxClose (status: 'min' | 'max' | 'close') {
  if (status === 'close') {
    ElMessageBox.confirm(
    '确认退出当前程序?',
    '警告',
    {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
      window.electronAPI.controlApp(status)
  }).catch(() => {
      ElMessage({
        type: 'info',
        message: '取消退出'
      })
    })
  } else {
    window.electronAPI.controlApp(status)
  }
}

function reload () {
  window.location.reload()
}
</script>

<template>
  <div>
    <div class="container">
      <div class="first-row">
        <div class="left">
          <slot name="left" />
        </div>
        <div class="right">
          <div class="control">
            <ZXIButton @click="reload">
              <i class="iconfont icon-shuaxin" />
            </ZXIButton>
            <ZXIButton @click="setMinMaxClose('min')">
              <i class="iconfont icon-zuixiaohua" />
            </ZXIButton>
            <ZXIButton @click="setMinMaxClose('max')">
             <i class="iconfont icon-zuidahua" />
            </ZXIButton>
            <ZXIButton @click="setMinMaxClose('close')">
              <i class="iconfont icon-guanbi1" />
            </ZXIButton>
          </div>
          <div class="slot">
            <slot name="right" />
          </div>
        </div>
      </div>
      <div>
        <slot name="bottom" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import url('theme');
.container{
  width: 100%;
  height: 100%;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  display: flex;
  flex-direction: column;
  .first-row{
    display: flex;
    .left{
      flex: auto;
    }
    .right{
      height: 100%;
      display: flex;
      flex-direction: column;
      .control{
        padding: 0.5rem 0 0.5rem 0;
        display: flex;
        justify-content: right;
        .iconfont{
          font-size: 2rem;
        }
        :nth-child(2n){
          margin: 0 @btnSpace;
        }
      }
      .slot{
        flex: auto;
      }
    }
  }
}
</style>