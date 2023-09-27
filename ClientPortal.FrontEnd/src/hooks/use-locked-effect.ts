import { DependencyList, useEffect, useRef } from 'react'

type EffectCallback = () => void | unknown | Promise<void> | Promise<unknown>

export const useLockedEffect = (effect: EffectCallback, deps?: DependencyList): void => {
  const ref = useRef(false)
  const asyncEffect = async () => await effect()

  useEffect(() => {
    if (ref.current) return
    ref.current = true
    asyncEffect().finally(() => {
      ref.current = false
    })
  }, deps)
}
