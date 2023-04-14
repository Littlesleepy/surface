/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare namespace Config {
  const baseUrl: string
  const authentication: {
    userName: string
    password: string
  }
  const enableFunction: Array<string>
  const initialParams: any
  const paramTlMaxCount: number
  const map:{
    sourceUrl:string
    zoom:number
    center:[number,number]
  }
}

interface IElectronAPI {
  readConfig: () => Promise<string>
  controlApp: (status: 'min' | 'max' | 'close') => void
  toggleDevTools: () => void
}

declare interface Window {
  electronAPI: IElectronAPI
}

declare module 'dom-to-image-more' {
  import domToImage from 'dom-to-image'
  export default domToImage
}
