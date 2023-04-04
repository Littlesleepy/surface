<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-29 17:04:47
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-21 13:54:38
 * @FilePath: \zxi-device\src\views\GlobalManager\GlobalManager.vue
 * @Description: 管理页
 -->

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const active = ref('Cache')

const route = useRoute()

const router = useRouter()

function selectItem (index: string) {
  router.push({ name: index })
}

watch(() => route.name, () => {
  active.value = route.name!.toString()
}, { immediate: true })

</script>

<template>
  <BaseFrame >
    <div class="global-manager">
      <div class="left">
        <el-menu
          :uniqueOpened="true"
          :default-active="active"
          class="el-menu-vertical-demo"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
          @select="selectItem">
          <el-sub-menu index="Cache">
            <template #title>
              <i class="iconfont icon-huancun" />
              <span>缓存</span>
            </template>
            <el-menu-item index="CacheParams">参数模板</el-menu-item>
            <el-menu-item index="CacheExport">导出/导入</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="SystemSetting">系统设置</el-menu-item>
        </el-menu>
      </div>
      <div class="right">
        <router-view/>
      </div>
    </div>
  </BaseFrame>
</template>

<style lang="less" scoped>
.iconfont{
  padding-right: 5px;
}
.global-manager{
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  background-color: #ffffff;
  .left{
    width: 200px;
    .el-menu-vertical-demo{
      height: 100%;
    }
  }
  .right{
    flex: auto;
  }
}
</style>