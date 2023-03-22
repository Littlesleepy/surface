<!--
 * @Author: 十二少 1484744996@qq.com
 * @Date: 2023-03-09 11:51:05
 * @LastEditors: 十二少 1484744996@qq.com
 * @LastEditTime: 2023-03-22 11:15:29
 * @FilePath: \zxi-deviced:\Zzy\project\zxi-surface\src\components\BaseParams\BaseParams.vue
 * @Description: 
 -->
<script setup lang="ts">
import { onBeforeUnmount, PropType, ref, toRaw, watch, WatchStopHandle } from 'vue'
import * as Helper from 'helper/index'
import { useFrameStore, useServerStore } from '@/store'
import { useRoute } from 'vue-router'
import * as Server from '@/server'
import { ElNotification, ElForm, ElMessage } from 'element-plus'
import { localStorageKey } from 'storage/index'
import { IDeviceFunc, IParam, IParamsTemplate } from '@/types'
import { ESwitchState } from 'mcharts/index';
import { IMockPanleState, EParamsType, IWorkMode, IParamElement } from '..'
import { Device, Sundry, UI } from 'helper/index'
import localForage from 'localforage'
import router from '@/router'
import { Keyboard } from 'mcharts/ZXIkeyboard'

const props = defineProps({
  inited: {
    type: Function as PropType<(mock: IMockPanleState) => void>,
    default: () => {}
  },
  needConnection: {
    type: Boolean,
    default: true
  },
  lconnected: {
    type: Function as PropType<(connection: Server.HubConnection) => void>,
    default: () => {}
  },
  beforeTaskStart: {
    type: Function as PropType<(paramsString: { value: string }, mock: IMockPanleState) => boolean>,
    default: () => {
      return true
    }
  },
  afterTaskEnd: {
    type: Function as PropType<() => void>,
    default: () => {}
  },
  disableBtnAfterTaskStart: {
    type: Object as PropType<{ all: boolean, keys?: { deviceParams?: Set<string>, viceParams?: Set<string> } }>,
    default: () => {
      return {
        all: true
      }
    }
  },
  beforeSendParamChange: {
    type: Function as PropType<(mock: IMockPanleState) => boolean>,
    default: () => {
      return true
    }
  },
  defaultWorkMode: {
    default: ''
  },
  vice: {
    type: Object as PropType<{
      rules?: Record<string, any>,
      elements: Array<Omit<IParamElement, 'show'>>,
      form: Record<string, any>
    }>,
    default: () => {
      return {
        rules: {},
        form: {},
        elements: []
      }
    }
  }
})

const emit = defineEmits<{
  (e: 'result', result: any)
}>()

// 注册enter失去焦点
function keyDown (e: KeyboardEvent) {
  if (e.key === 'Enter') {
    window.focus()
  }
}
window.addEventListener('keydown', keyDown)

// const whichOS = Sundry.whichOS()

const route = useRoute()

const funcDescrip = (() => {
  const funcs: Array<IDeviceFunc> = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONS)!)
  for (let i = 0, len = funcs.length; i < len; i++) {
    if (funcs[i].functionKey === route.name) {
      return funcs[i]
    }
  }
})()
/** 
 * @description: 跳转到创建任务
 * @return {*}
 */    
function goCreateTask () {
  // const name = (whichOS.isAndroid || whichOS.isPhone) ? 'TaskCreatePhone' : 'TaskCreatePc'
  // router.push({ name, query: { functionKey: route.meta.functionKey, from: UI.watchType.watchRealTime } })
}

/**
 * @description: 主机工况模式
 */
const workMode = ref<IWorkMode>()

const workModeOptions = ref<Array<IWorkMode>>(JSON.parse(localStorage.getItem(localStorageKey.KEY_WORKINGMODE)!))

if (props.defaultWorkMode && workModeOptions.value.length > 0) {
  workMode.value = workModeOptions.value[0]
  workModeOptions.value.forEach(option => {
    if (option.name === props.defaultWorkMode) workMode.value = option
  })
}

const elForm = ref<InstanceType<typeof ElForm>>()

const form = ref<any>({})

const rules = ref<any>()

const useFunctionArr = ref<Array<IParam>>([])

const elements = ref<Array<IParamElement>>([])

/* 长连接 */
let connection: Server.HubConnection

// 记录是否发生过重连
let hasReconnected = false

let taskId = ref<number>()

let oldBandwidth = '25'
// 用于自动参数
let oldDMRdebw = '25'
// DMR自动解调带宽
let olddPMRdebw = '25'
// DMR自动解调带宽
const viceForm = ref(props.vice.form)

const viceRules = ref(props.vice.rules ?? {})

const viceElements = ref(props.vice.elements)

const globalStore = useFrameStore()

const serverStore = useServerStore()

let unwatchRequestData: WatchStopHandle

// 渲染dom所需数据初始化
function allListInit () {
  // 创建长连接
  createConnection()
  // dom元素渲染
  useFunctionArr.value = JSON.parse(localStorage.getItem(localStorageKey.KEY_FUNCTIONPARAMLISTS)!)[route.name!]
  // 列表赋值
  form.value = JSON.parse(localStorage.getItem(localStorageKey.KEY_FORMS)!)[route.name!] // 缓存中获取表单数据
  const params = Helper.Device.createParamsPanleForDevice(useFunctionArr.value)
  rules.value = params.rules
  elements.value = params.elements
  // 随路音频
  if ('tcpaudio' in form.value) {
    if ('demodulation' in form.value && form.value.demodulation === '不解调') {
      form.value.tcpaudio = false
    } else {
      form.value.tcpaudio = true
    }
  }
  // 默认关闭原始数据保存
  if ('saverowdata' in form.value) form.value.saverowdata = false
  // 功能间跳转
  const describe = Device.linkDescribe.get(route.name as string)
  if (describe && route.query.linkKey) {
    const content = describe.get(route.query.linkKey as string)!
    for (const key of content) {
      if (key in form.value) form.value[key] = route.query[key]
    }
  }
  /* 附加参数 */
  const _viceForm = JSON.parse(localStorage.getItem(localStorageKey.KEY_VICEFORMS)!)[route.name!]
  if (_viceForm !== undefined) viceForm.value = _viceForm

  // 接收外部传入方法，修改form，elements，rules，viceForm，viceElements，viceRules
  props.inited(createMockStatus())
}

function watchRuleForm () {
  globalStore.m_form(form.value)
  Helper.Device.functionParamsLocaCache((route.name!).toString(), form.value)
  // 自动参数
  if ('bandwidth' in form.value && (form.value.bandwidth === '25' || form.value.bandwidth === '12.5')) {
    oldBandwidth = form.value.bandwidth
  }
  if ('debw' in form.value && (form.value.debw === '25' || form.value.debw === '12.5')) {
    oldDMRdebw = form.value.debw
  }
  if ('debw' in form.value && (form.value.debw === '25' || form.value.debw === '12.5' || form.value.debw === '6')) {
    olddPMRdebw = form.value.debw
  }
}

function watchPlayAnimation () {
  if (globalStore.s_playButton === ESwitchState.open) { // 临时任务开启后禁用部分按钮和输入框
    if (props.disableBtnAfterTaskStart.all) {
      elements.value.forEach((d: any) => { d.disabled = true })
      // 禁用附加参数
      viceElements.value.forEach((v: any) => { v.disabled = true })
    } else {
      if (props.disableBtnAfterTaskStart.keys !== undefined) {
        const deviceParams = props.disableBtnAfterTaskStart.keys.deviceParams
        if (deviceParams) {
          elements.value.forEach((d: any) => {
            if (deviceParams.has(d.paramName)) d.disabled = true
          })
        }

        const viceParams = props.disableBtnAfterTaskStart.keys.viceParams
        if (viceParams) {
          viceElements.value.forEach((v: any) => {
            if (viceParams.has(v.paramName)) v.disabled = true
          })
        }
      }
    }
  } else { // 关闭后解禁
    elements.value.forEach((sx: any) => { sx.disabled = false })
    // 解禁附加参数
    viceElements.value.forEach((vx: any) => { vx.disabled = false })
  }
}

/* ..................................................长连接.................................................. */
function requestData () { // 临时任务获取数据控制
  if (!connection) {
    ElMessage.error('长连接还未建立，请等待或刷新页面')
    return
  }
  if (taskId.value === undefined) {
    ElMessage.error('任务ID还未分配，请等待或刷新页面')
    return
  }
  if (globalStore.s_playButton === ESwitchState.open) { // 开启数据获取
    let str = (route.name!).toString() + '|' + Helper.Device.formDataString(form.value)

    const paramString = { value: str }
    // 发送前数据定制，如果返回false则不会启动任务
    const result = props.beforeTaskStart(paramString, createMockStatus())
    if (!result) {
      globalStore.m_playButton(ESwitchState.off)
    } else {
      connection.invoke('onMeasureStart', taskId.value, paramString.value, connection.connectionId)
    }
  } else { // 关闭数据获取，创建遮罩，防止连续点击开始
    const marker = Helper.Sundry.createMarker('关闭中')

    connection.invoke('onMeasureStop', taskId.value, connection.connectionId, 'false').finally(() => {
      marker.close()
      props.afterTaskEnd()
    })
  }
}

async function createConnection () { // 建立临时连接
  if (props.needConnection) {
    connection = Server.SignalR({ hub: Server.Hub.dataHub })

    connection.on('receiveData', (header: string, data: any) => {
      serverStore.m_serverReceiveData({ header, data })
    })

    await connection.start()
    taskId.value = await connection.invoke('onMakeRealTimeCallerID', connection.connectionId)
    console.log('临时任务连接' + connection.connectionId + '成功')
    // 监听开关
    unwatchRequestData = watch(() => globalStore.s_playButton, requestData)
    // 重连中提示
    let reconnecting: any
    connection.onreconnecting(() => {
      hasReconnected = true
      reconnecting = Helper.Sundry.createMarker('网络波动，自动重连')
    })

    // 若断开自动重连成功，简单提示断开
    connection.onreconnected(async () => {
      hasReconnected = false
      ElNotification.success('重连成功')
      reconnecting.close()
      if (connection) {
        taskId.value = await connection.invoke('onMakeRealTimeCallerID', connection.connectionId)
        requestData()
      }
    })

    // 监听长连接断开
    connection.onclose(async () => {
      if (reconnecting) reconnecting.close()
      // 如果进行过自动重连接，则手动重连
      if (hasReconnected) {
        await connection!.start()
        taskId.value = await connection!.invoke('onMakeRealTimeCallerID', connection!.connectionId)
        hasReconnected = false
        requestData()
      }
    })

    // 反出长连接实例
    props.lconnected(connection)
  }
}

// 发送参数变更
function getParams (value: any, key: string) {
  if (elForm.value) {
    elForm.value.validate((v) => {
      if (!v) {
        return false
      } else {
        elForm.value!.clearValidate()

        // 追加一些验证和修改
        if (!befoeSendParams(value, key)) return
        sendParams(value, key)
      }
    })
  }
}

function sendParams (value: any, key: string) { // 发送
  if (globalStore.s_playButton === ESwitchState.off || !connection) return
  changeParam(key, value)
}
/**
 * @description: 修改参数
 * @return {*}
 */
function changeParam (key: string, value: any) {
  connection.invoke('onParamChange', taskId.value, key, value.toString()).then((result) => {
    if (!result) {
      ElNotification({
        title: '错误',
        message: '任务已停止，请检查您输入的参数值并重启任务',
        type: 'error'
      })
      globalStore.m_playButton(ESwitchState.off)
    }
    globalStore.m_formOneResult({ result, key, value })
  }).catch(() => {
    globalStore.m_formOneResult({ result: false, key, value })
  })
}

// 参数发送给后端前的追加操作
function befoeSendParams (value: any, key: string) {
  if (!connection) return
  if ('begin' in form.value && Number(form.value.begin) >= Number(form.value.end)) {
    ElMessage.error('开始频率大于或等于结束频率')
    return false
  }
  // 解调参数影响随路音频
  if (key === 'demodulation' && value === '不解调') {
    if ('tcpaudio' in form.value) {
      if (form.value.tcpaudio === true) {
        form.value.tcpaudio = false
        ElMessage.success('已关闭随路音频')
      }

      if (globalStore.s_playButton === ESwitchState.open) changeParam('tcpaudio', false)
    }
  }
  if (key === 'demodulation' && value !== '不解调') {
    if ('tcpaudio' in form.value) {
      if (form.value.tcpaudio === false) {
        form.value.tcpaudio = true
        ElMessage.success('已打开随路音频')
      }

      if (globalStore.s_playButton === ESwitchState.open) changeParam('tcpaudio', true)
    }
  }
  // 解调模式TETRA仅支持解调带宽25kHz
  if (key === 'demodulation' && (value === 'TETRA' || value === '自动数字语音')) {
    // 如果选为'TETRA'或'自动数字语音'，必须先发送this.form.debw = '25'再发送'TETRA'或'自动数字语音'
    if ('debw' in form.value && form.value.debw !== '25') {
      form.value.debw = '25'
      if (globalStore.s_playButton === ESwitchState.open) changeParam('debw', 25)
      ElMessage.error(`解调模式${value}仅支持解调带宽25kHz`)
    }
  }
  if (key === 'debw' && value !== '25' && 'demodulation' in form.value && (form.value.demodulation === 'TETRA' || form.value.demodulation === '自动数字语音')) {
    form.value.debw = '25'
    ElMessage.error(`解调模式${form.value.demodulation}仅支持解调带宽25kHz`)
    return false
  }
  // 解调模式DMR仅支持解调带宽25和12.5kHz
  if (key === 'demodulation' && value === 'DMR') {
    // 如果选为'DMR'，必须先发送this.form.debw = '25'再发送'DMR'
    if ('debw' in form.value && form.value.debw !== '25' && form.value.debw !== '12.5') {
      form.value.debw = '25'
      if (globalStore.s_playButton === ESwitchState.open) changeParam('debw', 25)
      ElMessage.error('解调模式DMR仅支持解调带宽12.5/25kHz')
    }
  }
  if (key === 'debw' && (value !== '25' && value !== '12.5') && 'demodulation' in form.value && form.value.demodulation === 'DMR') {
    form.value.debw = oldDMRdebw
    ElMessage.error('解调模式DMR仅支持解调带宽12.5/25kHz')
    return false
  }
  // 解调模式dPMR仅支持解调带宽25和12.5和6kHz
  if (key === 'demodulation' && value === 'dPMR') {
    // 如果选为'dPMR'，必须先发送this.form.debw = '25'再发送'dPMR'
    if ('debw' in form.value && form.value.debw !== '25' && form.value.debw !== '12.5' && form.value.debw !== '6') {
      form.value.debw = '25'
      if (globalStore.s_playButton === ESwitchState.open) changeParam('debw', 25)
      ElMessage.error('解调模式dPMR仅支持解调带宽6/12.5/25kHz')
    }
  }
  if (key === 'debw' && (value !== '25' && value !== '12.5' && value !== '6') && 'demodulation' in form.value && form.value.demodulation === 'dPMR') {
    form.value.debw = olddPMRdebw
    ElMessage.error('解调模式dPMR仅支持解调带宽6/12.5/25kHz')
    return false
  }
  // 亚音频解码仅支持频谱带宽25和12.5kHz
  if (key === 'decode' && value !== '无') {
    if ('bandwidth' in form.value && form.value.bandwidth !== '12.5' && form.value.bandwidth !== '25') {
      form.value.bandwidth = '25'
      if (globalStore.s_playButton === ESwitchState.open) changeParam('bandwidth', 25)
      ElMessage.error('亚音频解码仅支持频谱带宽12.5/25kHz')
    }
  }
  if (key === 'bandwidth' && (value !== '25' && value !== '12.5') && 'decode' in form.value && form.value.decode !== '无') {
    form.value.bandwidth = oldBandwidth
    ElMessage.error('亚音频解码仅支持频谱带宽12.5/25kHz')
    return false
  }
  // 执行外部传入的操作
  const mockStatus = createMockStatus()
  mockStatus.changeParam = {
    key,
    value
  }
  return props.beforeSendParamChange(mockStatus)
}

/* .............................附加参数............................. */
function watchViceForm () {
  var rulforms = JSON.parse(localStorage.getItem(localStorageKey.KEY_VICEFORMS)!)
  rulforms[route.name!] = viceForm.value
  localStorage.setItem(localStorageKey.KEY_VICEFORMS, JSON.stringify(rulforms))
  globalStore.m_viceForm(viceForm.value)
}

function createMockStatus (): IMockPanleState {
  return {
    taskId: taskId,
    connection: connection,
    device:{
      form: form,
      elements: elements,
      rules: rules
    },
    vice:{
      form: viceForm,
      elements: viceElements,
      rules: viceRules
    }
  }
}

/**......................................参数模板...................................... */
const templateName = ref('')

const saveTemplateVisible = ref(false)
const useTemplateVisible = ref(false)

/**
 * @description: 保存参数模板
 * @return {*}
 */
function saveTemplate () {
  // 先获取该功能下的参数模板列表
  localForage.getItem(route.name as string)
    .then(v => {
      const save: IParamsTemplate = {
        functionKey: route.name as string,
        name: templateName.value,
        form: toRaw(form.value),
        viceForm: toRaw(viceForm.value),
        viceElements: toRaw(viceElements.value),
        workMode: toRaw(workMode.value)
      }
      if (v !== null) {
        const lists = v as Map<string, any>
        if (lists.size === Config.paramTlMaxCount) { // 超过最大储存限制，删除最前面一个
          for (const [key] of lists) {
            lists.delete(key)
            ElMessage.warning(`超过最大模板存储量，删除${key}`)
            break
          }
        }

        lists.set(templateName.value, save)
        localForage.setItem(route.name as string, lists)
      } else {
        // 直接写入
        const lists = new Map([[templateName.value, save]])
        localForage.setItem(route.name as string, lists)
      }
      ElMessage.success(`模板：${templateName.value}保存成功`)
    }).catch(err => {
      ElMessage.error(err)
    }).finally(() => {
      saveTemplateVisible.value = false
    })
}

const templateTable = ref<Array<IParamsTemplate>>([])
/**
 * @description: 打开参数模板
 * @return {*}
 */
function openTemplate () {
  localForage.getItem(route.name as string)
    .then(v => {
      if (v !== null) {
        templateTable.value = []
        for (const [, template] of v as Map<string, IParamsTemplate>) {
          templateTable.value.push(template)
        }
      }
    }).catch(err => {
      ElMessage.error(err)
    })
}
/**
 * @description: 使用模板
 * @param {IParamsTemplate}
 * @return {*}
 */
function useTemplate (t: IParamsTemplate) {
  workModeOptions.value.forEach(op => {
    if (op.name === t.workMode?.name) {
      workMode.value = t.workMode
    }
  })
  checkParamSetValue(t.viceForm, viceForm.value, viceElements.value)
  // 设备参数检查赋值
  checkParamSetValue(t.form, form.value, elements.value)

  ElMessage.success(`使用模板：${t.name}`)

  useTemplateVisible.value = false
}

function checkParamSetValue (source: any, target: any, elements: Array<any>) {
  Object.keys(target).forEach(key => {
    const cacheValue = source[key]
    if (cacheValue !== undefined) {
      // 依据参数类型判断该值是否可以给form
      for (let i = 0, len = elements.length; i < len; i++) {
        const el = elements[i]
        if (el.paramName === key) {
          switch (el.type) {
          // range判断范围
          case EParamsType.range: {
            const value = Number(cacheValue)
            if (el.minValue <= value && value <= el.maxValue) {
              target[key] = cacheValue
            }
          }
            break
          // enum判断选中是否存在该选项
          case EParamsType.enum: {
            let has = false
            for (let j = 0, len1 = el.valueList.length; j < len1; j++) {
              const op = el.valueList[j]
              if (op.value === cacheValue) {
                has = true
                break
              }
            }
            if (has) target[key] = cacheValue
          }
            break
          // boolean直接赋值
          default: target[key] = cacheValue
          }

          break
        }
      }
    }
  })
}
/**
 * @description: 删除模板
 * @param {IParamsTemplate} t
 * @return {*}
 */
function deleteTemplate (t: IParamsTemplate) {
  localForage.getItem(route.name as string)
    .then(v => {
      if (v !== null) {
        (v as Map<string, IParamsTemplate>).delete(t.name)
        templateTable.value = []
        for (const [, template] of v as Map<string, IParamsTemplate>) {
          templateTable.value.push(template)
        }
        localForage.setItem(route.name as string, v)
      }
    }).catch(err => {
      ElMessage.error(err)
    })
}

watch(form, watchRuleForm, { deep: true })

watch(() => globalStore.s_playButton, watchPlayAnimation)

watch(viceForm, watchViceForm, { deep: true })

watch(() => globalStore.s_formOne, (formOne) => {
  if (formOne === undefined) return
  form.value[formOne.key] = formOne.value
  // 如果任务进行中，向后台发送参数变更
  if (globalStore.s_playButton === ESwitchState.open && connection) {
    changeParam(formOne.key, formOne.value)
  }
})

watch(taskId, (value) => {
  globalStore.m_taskId(value)
})

watch(workMode, (newV, oldV) => {
  if (globalStore.s_playButton === ESwitchState.off && newV) {
    if (oldV) {
      // 放出上一次隐藏的元素
      oldV.hidenParams.forEach(param => {
        elements.value.forEach(el => {
          if (el.paramName === param.paramName) {
            el.show = true
          }
        })
      })
    }
    // 循环修改elements, form
    newV.hidenParams.forEach(param => {
      elements.value.forEach(el => {
        if (el.paramName === param.paramName) {
          el.show = false
        }
      })

      if (param.paramName in form.value) {
        form.value[param.paramName] = param.defaultValue
      }
    })
  }
}, { immediate: true })

allListInit()

onBeforeUnmount(() => {
  hasReconnected = false
  if (unwatchRequestData) unwatchRequestData()
  if (connection) connection.stop() // 关闭连接

  // mainStore.rootDispose()
})

defineExpose({
  getParams,
  form,
  rules,
  elements
})

function input () {
  console.log('input')
}


</script>

<template>
  <ZXIScroll :preventDefault="true" class="base-scroll" :wrapperStyle="{ backgroundColor: 'var(--el-bg-color)' }">
    <div class="content">
      <div class="item device" v-if="elements.length">
        <span class="title">设备参数</span>
        <ElForm
        ref="elForm"
        :model="form"
        :rules="rules"
        class="demo-ruleForm"
        :hide-required-asterisk="true">
          <el-form-item v-for="item in elements" :key="item.id" :prop="item.paramName" v-show="item.show">
            <ZXIInput
              v-if="item.type === EParamsType.range"
              @change="getParams(form[item.paramName], item.paramName)"
              v-model="form[item.paramName]"
              :max="item.maxValue"
              :min="item.minValue"
              :name="item.title"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              :readonly="true" />
            <ZXISelect
              v-if="item.type === EParamsType.enum"
              @change="getParams(form[item.paramName], item.paramName)"
              v-model="form[item.paramName]"
              :name="item.title"
              :disabled="item.disabled">
                <el-option
                  v-for="select in item.valueList"
                  :key="select.id"
                  :label="select.label"
                  :value="select.value" />
            </ZXISelect>
            <ZXISwitch
              v-if="item.type === EParamsType.boolean"
              @change="getParams(form[item.paramName], item.paramName)"
              v-model="form[item.paramName]"
              :name="item.title"
              :disabled="item.disabled" />
          </el-form-item>
        </ElForm>
      </div>
      <div class="item local" v-if="viceElements.length">
        <span class="title">附加参数</span>
        <ElForm
        :model="viceForm"
        :rules="viceRules"
        class="demo-ruleForm"
        :hide-required-asterisk="true">
          <el-form-item v-for="item in viceElements" :key="item.id"  :prop="item.paramName">
            <ZXIInput
              v-if="item.type === EParamsType.range"
              v-model="viceForm[item.paramName]"
              :name="item.title"
              :max="item.maxValue"
              :min="item.minValue"
              :placeholder="item.placeholder"
              :disabled="item.disabled"
              :readonly="true" />
            <ZXISelect
              v-if="item.type === EParamsType.enum"
              v-model="viceForm[item.paramName]"
              :name="item.title"
              :disabled="item.disabled">
                <el-option
                  v-for="select in item.valueList"
                  :key="select.value"
                  :label="select.label"
                  :value="select.value" />
            </ZXISelect>
            <ZXISwitch
              v-if="item.type === EParamsType.boolean"
              v-model="viceForm[item.paramName]"
              :name="item.title"
              :disabled="item.disabled" />
          </el-form-item>
        </ElForm>
      </div>
    </div>
  </ZXIScroll>
</template>

<style scoped lang="less">
@import url('theme');
.base-scroll{
  width: 100%;
  height: 400px;
}
.content{
  width: 100%;
  display: flex;
  flex-direction: column;
  color: @color;
  .item{
    padding: 10px;
    display: flex;
    flex-direction: column;
    .title {
      padding-bottom: 10px;
    }
    .title::before{
      display: inline-block;
      margin-right: 10px;
      content: '';
      width: 10px;
      height: 10px;
      border-radius: 10px;
      border: 1px solid @color;
    }
  }
  :deep(.demo-ruleForm) {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    .el-form-item{
      width: 48%;
    }
  }
}
</style>