import { UseStorageHook, useStorage } from './use-storage'

export const useSessionStorage = (): UseStorageHook => useStorage('sessionStorage')
