import { UseStorageHook, useStorage } from './use-storage'

export const useLocalStorage = (): UseStorageHook => useStorage('localStorage')
