import { reactive } from 'vue'

const excelForm: I_FormKeys = {
  title: {
    label: '标题',
    prop: 'title',
    type: 'range',
    span: 24
  },
  personal: {
    label: '监测人',
    prop: 'personal',
    type: 'range',
    span: 12
  },
  stationName: {
    label: '监测站',
    prop: 'stationName',
    type: 'range',
    span: 12
  }
}

const wordForm: I_FormKeys = {
  title: {
    label: '标题',
    prop: 'title',
    type: 'range',
    span: 24
  },
  personal: {
    label: '监测人',
    prop: 'personal',
    type: 'range',
    span: 12
  },
  stationName: {
    label: '监测站',
    prop: 'stationName',
    type: 'range',
    span: 12
  }
}

const pdfForm: I_FormKeys = {
  title: {
    label: '标题',
    prop: 'title',
    type: 'range',
    span: 24
  },
  personal: {
    label: '监测人',
    prop: 'personal',
    type: 'range',
    span: 12
  },
  stationName: {
    label: '监测站',
    prop: 'stationName',
    type: 'range',
    span: 12
  },
  watermark: {
    label: '水印',
    prop: 'watermark',
    type: 'range',
    span: 24
  }
}

const HomeForm: I_FormKeys = {
  title2: {
    label: '副标题',
    prop: 'title2',
    type: 'range',
    span: 12
  },
  subjectHeading: {
    label: '主题词',
    prop: 'subjectHeading',
    type: 'range',
    span: 12
  },
  no: {
    label: '编号',
    prop: 'no',
    type: 'range',
    span: 12
  },
  secretLevel: {
    label: '密级',
    prop: 'secretLevel',
    type: 'menu',
    span: 6,
    valueList: [
      {
        id: 0,
        label: '公开',
        tooltip: '',
        value: '公开'
      },
      {
        id: 1,
        label: '内部',
        tooltip: '',
        value: '内部'
      },
      {
        id: 2,
        label: '绝密',
        tooltip: '',
        value: '绝密'
      }
    ]
  },
  slowLevel: {
    label: '缓级',
    prop: 'slowLevel',
    type: 'menu',
    span: 6,
    valueList: [
      {
        id: 3,
        label: '一般',
        tooltip: '',
        value: '一般'
      },
      {
        id: 4,
        label: '加急',
        tooltip: '',
        value: '加急'
      },
      {
        id: 5,
        label: '紧急',
        tooltip: '',
        value: '紧急'
      }
    ]
  },

  companyName: {
    label: '公司名称',
    prop: 'companyName',
    type: 'range',
    span: 12
  },
  department: {
    label: '部门',
    prop: 'department',
    type: 'range',
    span: 6
  },
  signer: {
    label: '签发人',
    prop: 'signer',
    type: 'range',
    span: 6
  },
  lookUpText: {
    label: '抬头',
    prop: 'lookUpText',
    type: 'range',
    span: 24
  },

  text: {
    label: '正文',
    prop: 'text',
    type: 'textarea',
    span: 24
  }
}
type T_Range = {
  label: string
  prop: string
  type: 'range'
  span?: number
}
type T_Menu = {
  label: string
  prop: string
  type: 'menu'
  span?: number
  valueList: Array<{
    id: number
    label: string
    tooltip: string
    value: string
  }>
}
type T_Textarea = {
  label: string
  prop: string
  type: 'textarea'
  span?: number
}
interface I_FormKeys {
  [key: string]: T_Range | T_Menu | T_Textarea
}

type T_ExportFormKeys = {
  [key: string]: I_FormKeys
}

const ExportFormKeys: T_ExportFormKeys = {
  PDF: pdfForm,
  PDFHome: {
    ...pdfForm,
    ...HomeForm
  },
  Excel: excelForm,
  Word: wordForm
}

export const ExportForm = reactive<any>({
  title: '监测结果',
  personal: '',
  stationName: '',
  watermark: '',
  no: '',
  title2: '',
  companyName: '',
  lookUpText: '',
  text: '',
  department: '',
  signer: '',
  subjectHeading: '',
  secretLevel: '公开',
  slowLevel: '一般'
})

export function getFormType(type: 'PDF' | 'Excel' | 'Word', isHome: boolean) {
  return isHome ? ExportFormKeys[home(type)] : ExportFormKeys[type]
}

function home(type: 'PDF' | 'Excel' | 'Word') {
  const home = `${type}Home`
  return home in ExportFormKeys ? home : type
}
