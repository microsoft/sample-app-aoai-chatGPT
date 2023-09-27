import { UseStoredState, useStoredState } from './use-stored-state'

export const useLocalState = <S>(key: string, initialState?: S): UseStoredState<S> =>
  useStoredState(key, initialState, { storage: 'localStorage' })
