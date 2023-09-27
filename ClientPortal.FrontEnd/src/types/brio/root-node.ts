import { BrioNode } from './node'

export type BrioRootNode = {
  files?: unknown[]
  nodeType?: string
  options?: unknown[]
  readOnly?: boolean
  subNodes: BrioNode[]
}
