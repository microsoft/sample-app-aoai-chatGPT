export type StorageType = 'localStorage' | 'sessionStorage'

export type UseStorageHook = {
  clear: () => void
  getItem: <T = unknown>(key: string, defaultValue?: T) => T | undefined
  removeItem: (key: string) => void
  popItem: <T = unknown>(key: string, defaultValue?: T) => T | undefined
  setItem: <T = unknown>(key: string, value: T) => void
}

const isBrowser = (): boolean => typeof window !== 'undefined'

export const safelyParseWithFallback = <T = any>(input: any): T => {
  try {
    return JSON.parse(input)
  } catch (_) {
    /* ignored */
  }
  return input as T
}

export const useStorage = (storage: StorageType = 'localStorage'): UseStorageHook => {
  const clear = (): void => {
    if (!isBrowser()) return
    window[storage].clear()
  }

  const getItem = <T = any>(key: string): T | undefined => {
    if (!isBrowser()) return
    const value = window[storage][key]
    return value ? safelyParseWithFallback(value) : undefined
  }

  const removeItem = (key: string): void => {
    if (!isBrowser()) return
    window[storage].removeItem(key)
  }

  const popItem = <T = any>(key: string): T | undefined => {
    const item = getItem(key)
    if (item) removeItem(key)
    return item
  }

  const setItem = <T = any>(key: string, value: T): void => {
    if (!isBrowser()) return
    window[storage].setItem(key, JSON.stringify(value))
  }

  return {
    clear,
    getItem,
    removeItem,
    popItem,
    setItem,
  }
}
