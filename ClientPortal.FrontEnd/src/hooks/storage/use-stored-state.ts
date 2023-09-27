import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { StorageType, useStorage } from './use-storage'

export type RemoveStateDispatch = () => void
export type UseStoredState<S> = [S, Dispatch<SetStateAction<S>>, RemoveStateDispatch]

type Options = {
  namespace: string
  storage: StorageType
}

export const useStoredState = <S>(
  key: string,
  initialState?: S,
  options: Partial<Options> = {},
): UseStoredState<S> => {
  const { namespace, storage = 'localStorage' } = options
  const storageKey = namespace ? `${namespace}:${key}` : key

  const { getItem, setItem, removeItem } = useStorage(storage)
  const [state, setState] = useState<S>(getItem<S>(storageKey) || (initialState as S))
  const removeState = () => setState(undefined as S)

  useEffect(() => {
    if (state === undefined) {
      removeItem(storageKey)
    } else {
      setItem<S>(storageKey, state)
    }
  }, [state, storageKey, removeItem, setItem])

  return [state, setState, removeState]
}
