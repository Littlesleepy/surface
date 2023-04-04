<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2022-12-30 17:12:35
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-01-03 15:35:56
 * @FilePath: \zxi-device\src\views\GlobalManager\Cache\CacheExport.vue
 * @Description: 一键导入导出缓存
 -->

<script setup lang="ts">
import { IDeviceFunc, IParamsCache, localStorageKey } from '@/storage'
import { EParamsType, IParamsTemplate } from '@/types'
import { ElMessage } from 'element-plus'
import localforage from 'localforage'
import { ref } from 'vue'
enum ExportType {
  /** 
   * @description: 参数模板
   */  
  paramTemplate = 'paramTemplate'
}
/** 
 * @description: 所有导出结果
 */
interface IExport {
  name: ExportType
  data: any
}
/** 
 * @description: 导出的参数模板
 * @return {*}
 */
interface IExportParamTemplate {
  /** 
   * @description: 功能名称
   */  
  functionKey: string
  /** 
   * @description: 功能参数模板
   * @return {*}
   */  
  templates: Array<IParamsTemplate>
}

const funcs: Array<IDeviceFunc> = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONS)!)
/** 
 * @description: 所有功能每一项参数描述
 */    
const allParamsDescribe: IParamsCache = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONPARAMLISTS)!)

const checkTypes = [ExportType.paramTemplate]
const checkList = ref([ExportType.paramTemplate])

const checkAll = ref(checkList.value.length === checkTypes.length)
const isIndeterminate = ref(checkList.value.length > 0 && checkList.value.length < checkTypes.length)

function handleCheckAllChange (val: boolean) {
  checkList.value = val ? checkTypes : []
  isIndeterminate.value = false
}

function handleCheckedCitiesChange (value: string[]) {
  const checkedCount = value.length
  checkAll.value = checkedCount === checkTypes.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < checkTypes.length
}


/** 
 * @description: 导出所有缓存
 * @return {*}
 */    
function exportAll () {
  const result: Array<IExport> = []
  // 构造promise集合
  const allPromise: Array<Promise<IExport>> = []
  checkList.value.forEach(name => {
    switch (name) {
    case ExportType.paramTemplate: {
      const p = new Promise((resolve: (value: IExport ) => void) => {
        exportParamTemplate().then(r => {
          resolve(r)
        })
      })

      allPromise.push(p)
    }
      break
    }
  })

  // 执行promise集合
  Promise.all(allPromise).then(rs => {
    rs.forEach(r => {
      result.push(r)
    })

    const blob = new Blob([JSON.stringify(result)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    const deviceInfo = JSON.parse(localStorage.getItem(localStorageKey.KEY_DEVICEINFO)!)
    a.download = `${deviceInfo.deviceName}缓存.json`
    a.click()
  })
}
/** 
 * @description: 导入所有缓存
 * @return {*}
 */    
function importAll (){
  const inputDom = document.createElement('input')
  inputDom.setAttribute('type', 'file')
  inputDom.setAttribute('accept', 'application/json')

  inputDom.onchange = function () {
    const reader = new FileReader()

    reader.onload = function (evt) {
      const data: Array<IExport> = JSON.parse(evt.target!.result! as string)
      data.forEach(item => {
        // 确定是否选择导入
        if (checkList.value.includes(item.name)) {
          importParamTemplate(item.data)
        }
      })
    }

    reader.readAsText(inputDom.files![0])
  }

  inputDom.click()
}

/**.........................................参数模板......................................... */
/** 
 * @description: 导出参数模板
 * @return {*}
 */    
function exportParamTemplate () {
  const result: IExport = {
    name: ExportType.paramTemplate,
    data: [] as Array<IExportParamTemplate>
  }
  // 构造promise集合
  const allPromise: Array<Promise<any>> = []

  funcs.forEach(f => {
    const p = new Promise((resolve) => {
      localforage.getItem(f.functionKey)
        .then(v => {
          resolve({ functionKey: f.functionKey, templates: v })
        })
    })

    allPromise.push(p)
  })
  // 执行promise集合
  return Promise.all(allPromise).then(v => {
    const values = v as Array<{ functionKey: string, templates: Map<string, IParamsTemplate> | null }>

    values.forEach(value => {
      if (value.templates !== null) {
        const r: IExportParamTemplate = { functionKey: value.functionKey, templates: [] }
        for (const [, t] of value.templates) {
          r.templates.push(t)
        }

        result.data.push(r)
      }
    })

    return Promise.resolve(result)
  })
}
/** 
 * @description: 导入参数模板
 * @param {Array} data 参数模板
 * @return {*}
 */       
function importParamTemplate (data: Array<IExportParamTemplate>) {
  // 构造promise集合
  const allPromise: Array<Promise<any>> = []

  data.forEach(cache => {
    // 先查看设备是否有此功能
    let hasFun = false
    funcs.forEach(f => {
      if (f.functionKey === cache.functionKey) hasFun = true
    })
    // 开始改变缓存参数值
    if (hasFun) {
      const cacheResult = new Map<string, IParamsTemplate>()

      const templates: Array<IParamsTemplate> = cache.templates
      // 和设备要求的参数对比
      const describe = allParamsDescribe[cache.functionKey]
      templates.forEach(t => {
        const newForm = {}
        describe.forEach(d => {
          // 导入的参数值
          const cacheValue = t.form[d.paramName]
          if (cacheValue !== undefined) {
            // 检查
            switch (d.paramType) {
            // 输入型
            case EParamsType.range: {
              const value = Number(cacheValue)
              if (d.minValue <= value && value <= d.maxValue) {
                newForm[d.paramName] = cacheValue.toString()
              } else {
                newForm[d.paramName] = ((d.minValue + d.maxValue) / 2).toFixed(0)
              }
            }
              break
            // 枚举
            case EParamsType.enum: {
              let has = false
              for (let j = 0, len = d.valueList!.length; j < len; j++) {
                const op = d.valueList![j]
                if (op === cacheValue) {
                  has = true
                  break
                }
              }
              if (has) {
                newForm[d.paramName] = cacheValue
              } else {
                newForm[d.paramName] = d.valueList![0]
              }
            }
              break
            // boolean
            default: newForm[d.paramName] = cacheValue
            }
          } else {
            switch (d.paramType) {
            case EParamsType.range: { newForm[d.paramName] = parseFloat(((d.minValue + d.maxValue) / 2).toFixed(0)) }
              break
            case EParamsType.enum: { newForm[d.paramName] = d.valueList![0] }
              break
            default: { newForm[d.paramName] = false }
            }
          }
        })
        // 改变缓存表单值
        t.form = newForm
        cacheResult.set(t.name, t)
      })
      // 缓存
      const p = new Promise((resolve) => {
        localforage.setItem(cache.functionKey, cacheResult).then(() => {
          resolve(cache.functionKey)
        })
      })

      allPromise.push(p)
    }
  })

  Promise.all(allPromise).then(() => {
    ElMessage.success('导入成功')
  }).catch(() => {
    ElMessage.error('导入失败')
  })
}
</script>

<template>
  <div class="cache-export">
    <div class="center">
      <p class="tip">提示：先选择要导入/导出的缓存内容</p>
      <!-- 导入导出选项区 -->
      <div class="check-box">
        <el-checkbox
          class="check-item"
          size="large"
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          @change="handleCheckAllChange"
          >全选</el-checkbox>
        <el-checkbox-group class="check-item" v-model="checkList" size="large" @change="handleCheckedCitiesChange">
          <el-checkbox :label="ExportType.paramTemplate">参数模板</el-checkbox>
        </el-checkbox-group>
      </div>
      <div class="button">
        <el-tooltip
          effect="dark"
          content="以json文件导出勾选的缓存内容"
          placement="bottom">
          <el-button type="primary" size="large" round @click="exportAll">导出</el-button>
        </el-tooltip>
        <el-tooltip
          effect="dark"
          content="选择一个合适的json文件导入选择的缓存内容"
          placement="bottom">
          <el-button type="warning" size="large" round @click="importAll">导入</el-button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@borderColor: #b9b9b9;
.cache-export{
  width: 100%;
  height: 100%;
  display: flex;
  .center {
    margin: auto;
    display: flex;
    flex-direction: column;
    width: 300px;
    border: 1px solid @borderColor;
    padding: 15px;
    .tip{
      margin: 0 auto;
      padding: 0 0 10px 0;
      color: rgb(126, 126, 126);
    }
    .check-box{
      margin: 0 auto;
      display: flex;
      .check-item{
        margin: auto 0;
        padding: 0 10px 10px 0;
      }
    }
    .button{
      margin: 0 auto;
      display: flex;
    }
  }
}
</style>