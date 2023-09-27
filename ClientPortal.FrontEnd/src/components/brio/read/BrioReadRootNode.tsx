import { FlexCol } from '@carnegie/duplo'
import { FC } from 'react'
import { BrioNode, BrioRootNode as BrioRootNodeProps, FormState } from '../../../types'
import { BrioReadNode } from './BrioReadNode'

type Props = Pick<BrioRootNodeProps, 'subNodes'> & {
  debug?: boolean
}

const extractFormState = (subNodes: BrioNode[]): FormState => {
  let formState: FormState = {}

  for (const node of subNodes) {
    if (node.subNodes?.length) {
      formState = { ...formState, ...extractFormState(node.subNodes) }
    } else {
      formState[node.id] = node.value || null
    }
  }

  return formState
}

export const BrioReadRootNode: FC<Props> = ({ debug, subNodes }) => {
  const formState: FormState = extractFormState(subNodes)

  if (debug) {
    console.debug('[BrioReadRootNode] subNodes', subNodes)
    console.debug('[BrioReadRootNode] form state', formState)
  }

  return (
    <FlexCol gap={16}>
      {subNodes.map(props => (
        <BrioReadNode key={props.id} formState={formState} {...props} />
      ))}
    </FlexCol>
  )
}
