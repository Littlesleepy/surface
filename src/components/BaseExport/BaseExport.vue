
<script setup lang='ts'>
// import { ToExport } from '@/helper';
import { ToExport } from "@/helper/dataExports/index";
import { FormInstance } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { getFormType, ExportForm } from "./form";
import BaseIconButton from "cp/BaseIconButton/BaseIconButton.vue";
import { useRoute } from "vue-router";

// const props = defineProps({
//   modelValue: {
//     type: Boolean,
//     required: true
//   }
// })

// const emit = defineEmits(['update:modelValue'])

// const dialogVisible = computed({
//   get() {
//     return props.modelValue
//   },
//   set(v: boolean) {
//     emit('update:modelValue', v)
//   }
// })

const dialogVisible = ref(false)

const handleClose = (done: () => void) => {
  done()
  dialogVisible.value = false
}
const route = useRoute()
const list = reactive([
  {
    id: 0,
    value: 'PDF',
    label: 'PDF',
    tooltip: 'PDF'
  },
  {
    id: 1,
    value: 'Excel',
    label: 'Excel',
    tooltip: 'Excel'
  },
  {
    id: 2,
    value: 'Word',
    label: 'Word',
    tooltip: 'Word'
  }

])
const ruleFormRef = ref<FormInstance>()
const isHome = ref(false)
const type = ref<'Excel' | 'PDF' | 'Word'>('Excel')
const form = computed(() => {
  return getFormType(type.value, isHome.value)
})

function spanToWidth(span: number | undefined) {
  return `${span ? span * 100 / 24 : 50}%`
}
function Export() {
  ToExport.setOptions({
    ...ExportForm,
    isCustomHome: isHome.value,
    exportName : route.meta.title
  })
  dialogVisible.value = false
  ToExport.download(type.value)
  queueMicrotask(()=>{
    ruleFormRef.value?.resetFields()
  })
}


</script>

<template>
  <div class="baseExport">
    <BaseIconButton class="iconBtn" v-bind=" $attrs " :icon="'icon-daochu1'" :icon-size="'4.5rem'" :text="'导出'" @click="dialogVisible=!dialogVisible"/>
    <Teleport to="body">
      <el-dialog top="0vh" class="export-dialog" v-model="dialogVisible" width="800px" :before-close="handleClose">
        <div class="layout">
          <div class="header">
            <el-form class="header-form">
              <el-form-item>
                <el-select :prepend="'导出类型'" v-model="type" :valueList="list">
                  <el-option
                  v-for="item in list"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
                <template #prefix>
                  <div>导出类型</div>
                </template>
                </el-select>
              </el-form-item>
              <el-form-item v-if="type === 'PDF'">
                <ZXISwitch :name="'首页定制'" v-model="isHome"></ZXISwitch>
              </el-form-item>
            </el-form>
          </div>
          <div class="main">
            <el-form class="main-form" ref="ruleFormRef" :model="ExportForm" :hide-required-asterisk="true"
              :label-position="'top'">
              <el-form-item v-for="item in form" :prop="item.prop" :key="item.prop" :class="item.type"
                :style="{ width: spanToWidth(item.span) }" :label="item.type === 'textarea' ? item.label : ''">
                <el-input class="pm-input" v-if="item.type === 'range'" v-model="ExportForm[item.prop]">
                  <template #prepend>{{ item.label }}</template>
                </el-input>
                <el-input v-else-if="item.type === 'textarea'" :autosize="{ minRows: 2, maxRows: 4 }" type="textarea"
                  :prepend-slot="item.label" v-model="ExportForm[item.prop]"></el-input>
                <el-select v-else-if="item.type === 'menu'" :prepend="item.label" :value-list="item.valueList"
                  v-model="ExportForm[item.prop]">
                  <el-option
                    v-for="subItem in item.valueList"
                    :key="subItem.value"
                    :label="subItem.label"
                    :value="subItem.value"
                  />
                  <template #prefix>{{ item.label }}</template>
                </el-select>
              </el-form-item>
            </el-form>
          </div>
          <div class="footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button @click="Export">导出</el-button>
          </div>
        </div>
      </el-dialog>
    </Teleport>
  </div>
</template>

<style>
.export-dialog{
  height: 100%;
  margin-bottom: 0;
}
</style>
<style scoped lang="less">
.baseExport{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .iconBtn{
    flex: 1;
  }
}

.el-form-item{
  padding: 1px;
  box-sizing: border-box;
}
.header-form {
  width: 100%;
  display: flex;
  flex-wrap: wrap;

  >div {
    width: 50%;
    max-width: 200px;
    margin-right: 10px;
  }
}

.main-form {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

}

.layout {
  display: flex;
  flex-direction: column;
  height: 80vh;
  .el-form{
    align-content: flex-start;
  }
  .header {
    width: 100%;
    display: flex;
  }

  .main {
    margin-top: 10px;
    flex: auto;
    display: flex;
  }

  .footer {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>