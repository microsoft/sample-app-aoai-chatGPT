import { DependencyList, useEffect } from 'react'

type AsyncEffectCallback = () => Promise<void> | Promise<unknown>

export const useAsyncEffect = (effect: AsyncEffectCallback, deps?: DependencyList): void => {
  useEffect(() => {
    effect().then()
  }, deps)
}
