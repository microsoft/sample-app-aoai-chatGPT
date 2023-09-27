import { UseStoredState, useStoredState } from './use-stored-state'

export const useSessionState = <S>(key: string, initialState?: S): UseStoredState<S> =>
  useStoredState(key, initialState, { storage: 'sessionStorage' })
