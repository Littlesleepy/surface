<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-30 09:17:10
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-02-21 13:54:07
 * @FilePath: \zxi-device\src\views\GlobalManager\Cache\CacheParams.vue
 * @Description: 参数缓存管理
 -->

<script setup lang="ts">
import { EParamsType, IDeviceFunc, IParamsTemplate, IWorkMode } from '@/types'
import { ref, toRaw, watch } from 'vue'
import { IParam, localStorageKey } from '@/storage'
import localForage from 'localforage'
import { ElMessage } from 'element-plus'
import BaseParamsTemp from 'cp/BaseParamsTemp/BaseParamsTemp.vue'
import { Device } from '@/helper'

/**...........................................模板列表........................................... */
const functionOptions: Array<{ value: string, label: string }> = []

const funcs: Array<IDeviceFunc> = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONS)!)
const measureFunction = ref(funcs[0].functionKey)

funcs.forEach(f => {
  functionOptions.push({ label: f.name, value: f.functionKey })
})

const templateTable = ref<Array<IParamsTemplate>>([])
/** 
 * @description: 打开参数模板
 * @return {*}
 */    
function openTemplate (name: string) {
  templateTable.value = []
  localForage.getItem(name)
    .then(v => {
      if (v !== null) {
        for (const [, template] of v as Map<string, IParamsTemplate>) {
          templateTable.value.push(template)
        }

        if (templateTable.value.length > 0) {
          rowClick(templateTable.value[0])
        } else {
          clear()
        }
      } else {
        clear()
      }
    }).catch(err => {
      ElMessage.error(err)
      clear()
    })
}

/** 
 * @description: 删除模板
 * @param {IParamsTemplate} t
 * @return {*}
 */    
function deleteTemplate (t: IParamsTemplate) {
  if (t.functionKey === measureFunction.value && t.name === currentTemplate.value?.name) clear()
  
  localForage.getItem(measureFunction.value)
    .then(v => {
      if (v !== null) {
        (v as Map<string, IParamsTemplate>).delete(t.name)
        templateTable.value = []
        for (const [, template] of v as Map<string, IParamsTemplate>) {
          templateTable.value.push(template)
        }
        localForage.setItem(measureFunction.value, v)

        ElMessage.success(`删除：${t.name}成功`)
      }
    }).catch(err => {
      ElMessage.error(err)
    })
}

watch(measureFunction, (key) => {
  openTemplate(key)
}, { immediate: true })

/** ..................................模板参数.................................. */
/**
 * @description: 主机工况模式
 */
const workMode = ref<IWorkMode>()

const workModeOptions = ref<Array<IWorkMode>>(JSON.parse(localStorage.getItem(localStorageKey.KEY_WORKINGMODE)!))

const form = ref<any>({})

const rules = ref<any>()

const elements = ref<Array<any>>([])

const viceForm = ref({})

const viceRules = ref<any>({})

const viceElements = ref<Array<any>>([])

const currentTemplate = ref<IParamsTemplate>()

function rowClick (row: IParamsTemplate, column?: any) {
  if (column === undefined || (column !== undefined && column.label !== '操作')) {
    currentTemplate.value = row

    workMode.value = row.workMode

    viceForm.value = row.viceForm
    viceElements.value = row.viceElements

    viceRules.value = {}
    viceElements.value.forEach(el => {
      if (el.type === EParamsType.range) {
        viceRules.value[el.paramName] = [
          { required: true, message: '不能为空', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value > el.maxValue || value < el.minValue) {
                viceForm.value[el.paramName] = parseFloat(((el.maxValue + el.minValue) / 2).toFixed(0))
                ElMessage.warning(`您提供的值不在使用范围${el.placeholder}，自动修改为${viceForm.value[el.paramName]}`)
                return callback()
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      }
    })

    const useFunctionArr: Array<IParam> = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONPARAMLISTS)!)[measureFunction.value]

    form.value = row.form // 缓存中获取表单数据
    const result = Device.createParamsPanleForDevice(useFunctionArr)
    rules.value = result.rules
    elements.value = result.elements
  }
}
/** 
 * @description: 模板保存
 * @return {*}
 */    
function saveTemplate () {
  if (currentTemplate.value) {
    localForage.getItem(measureFunction.value)
      .then(v => {
        const save = {
          name: currentTemplate.value!.name, 
          form: toRaw(form.value),
          viceForm: toRaw(viceForm.value),
          viceElements: toRaw(viceElements.value),
          workMode: toRaw(workMode.value)
        }
        if (v !== null) {
          const lists = v as Map<string, any>
          lists.set(currentTemplate.value!.name, save)
          localForage.setItem(measureFunction.value, lists)
        }
      }).catch(err => {
        ElMessage.error(err)
      })
  }
}

function clear () {
  currentTemplate.value = undefined
  workMode.value = undefined
  elements.value = []
  viceElements.value = []
}

</script>

<template>
  <div class="cache-params">
    <div class="left">
      <!-- 功能选取 -->
      <div class="block selcet">
        <p class="title">一、功能选取</p>
        <el-select class="item" v-model="measureFunction" size="small">
          <el-option
            v-for="item in functionOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <!-- 模板列表 -->
      <div class="block list">
        <p class="title">二、模板列表</p>
        <ZXIScroll class="scroll">
          <el-table
            :data="templateTable"
            style="width: 100%;height: 100%;"
            @row-click="rowClick">
            <el-table-column prop="name" label="名称" min-width="150" :show-overflow-tooltip="true" />
            <el-table-column label="操作" min-width="60">
              <template #default="scope">
                <div style="display: flex;">
                  <el-button
                    type="danger"
                    @click="deleteTemplate(scope.row)">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </ZXIScroll>
      </div>
    </div>
    <!-- 模板参数 -->
    <div class="right">
      <p class="tip">注意：任何参数修改都将改变缓存中的数据！！！</p>
      <!-- 设备和附加参数 -->
      <div class="second">
        <div class="device-vice" v-if="elements.length > 0">
          <!-- 主机工况 -->
          <div class="work-mode" v-if="workMode">
            <span>主机工况</span>
            <el-select v-model="workMode" @change="saveTemplate" value-key="name">
              <el-option
                v-for="item in workModeOptions"
                :key="item.name"
                :label="item.name"
                :value="item"
              />
            </el-select>
          </div>
          <!-- 设备参数 -->
          <div class="device">
            <p class="title">设备参数</p>
            <BaseParamsTemp
              class="params"
              :params="form"
              :elements="elements"
              :rules="rules"
              :cache="false"
              :itemStyle="{ width: '100%' }"
              @paramsChange="saveTemplate" />
            </div>
        </div>
        <div class="device-vice" v-if="viceElements.length > 0">
          <p class="title">附加参数</p>
          <BaseParamsTemp
            class="params"
            :params="viceForm"
            :elements="viceElements"
            :rules="viceRules"
            :cache="false"
            :itemStyle="{ width: '100%' }"
            @paramsChange="saveTemplate" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@borderColor: #b9b9b9;
.title{
  padding: 10px 0;
  font-weight: 700;
}
.cache-params{
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  .left{
    width: 32%;
    max-width: 350px;
    display: flex;
    flex-direction: column;
    margin-right: 20px;
    .block{
      border: 1px solid @borderColor;
      padding: 10px;
    }
    .list{
      margin-top: 20px;
      flex: auto;
      display: flex;
      flex-direction: column;
      .scroll{
        flex: auto;
      }
    }
  }
  .right{
    flex: auto;
    border: 1px solid @borderColor;
    padding: 10px;
    display: flex;
    flex-direction: column;
    .tip{
      padding: 0 0 10px 0;
      color: rgb(126, 126, 126);
    }
    .second{
      flex: auto;
      display: flex;
      .device-vice{
        flex: auto;
        display: flex;
        flex-direction: column;
        width: 50%;
        max-width: 300px;
        min-width: 230px;
        margin-right: 20px;
        .work-mode{
          display: flex;
          padding: 10px 0;
          width: 100%;
          >span{
            line-height: 24px;
            vertical-align: middle;
            font-weight: 600;
            width: 130px;
          }
        }
        .device{
          flex: auto;
          display: flex;
          flex-direction: column;
        }
        .params{
          flex: auto;
        }
      }
    }
  }
}
</style>