export class EventEmitter extends EventTarget {
  private manager = new Map<string, { listener: any, capture: boolean }>()

  on = (type: string, listener, options?: boolean | {
    once?: boolean
    passive?: boolean
    signal?: AbortSignal
    capture?: boolean
  }) => {
    let capture = false
    if (options !== undefined) {
      if (typeof options === 'boolean') {
        capture = options
      } else {
        if (options.capture !== undefined) capture = options.capture
      }
    }
    this.manager.set(type, { listener, capture })

    this.addEventListener(type, function wrap (e: any) {
      listener.__wrap__ = wrap
      // @ts-ignore
      listener.apply(this, e.detail || [])
    }, options)
  }

  off = (type: string, listener, capture = false) => {
    this.removeEventListener(type, listener.__wrap__, capture)
    this.manager.delete(type)
  }

  emit = (type: string, ...args) => this.dispatchEvent(new CustomEvent(type, { detail: args }))

  once = (type: string, listener, options?: boolean | {
    passive?: boolean
    signal?: AbortSignal
    capture?: boolean
  }) => {
    let signal
    const option: any = {
      once: true,
      passive: false,
      capture: false
    }
    if (options) {
      if (typeof options === 'boolean') {
        option.capture = options
      } else {
        if (options.passive !== undefined) option.passive = options.passive
        if (options.capture !== undefined) option.capture = options.capture
        if (options.signal !== undefined) signal = options.signal
      }
    }
    if (signal) option.signal = signal
    this.on(type, listener, option)
  }

  dispose () {
    for (const [key, value] of this.manager) {
      this.off(key, value.listener, value.capture)
    }
  }
  
}