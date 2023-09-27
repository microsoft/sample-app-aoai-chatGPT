import { ParentFC } from './types'

export type ContextProvider<T = Record<string, unknown>> = ParentFC<T>
