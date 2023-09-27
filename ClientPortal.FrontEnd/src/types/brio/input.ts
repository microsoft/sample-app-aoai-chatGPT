import { BrioNode } from './node'

export type BrioInput = Pick<BrioNode, 'id' | 'helpText' | 'helpTitle' | 'readOnly' | 'text' | 'value'>

export type BrioInputWithOptions = BrioInput & Pick<BrioNode, 'options'>
