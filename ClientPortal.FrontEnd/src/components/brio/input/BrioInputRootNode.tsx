import { DuploSpaces, FlexCol } from '@carnegie/duplo'
import { FC } from 'react'
import { BrioRootNode as BrioRootNodeProps, RuleViolations } from '../../../types'
import { BrioInputNode } from './BrioInputNode'

type Props = Pick<BrioRootNodeProps, 'subNodes'> &
  Partial<RuleViolations> & {
    debug?: boolean
    gap?: DuploSpaces
  }

export const BrioInputRootNode: FC<Props> = ({
  debug,
  gap = 16,
  ruleViolations = [],
  subNodes,
}) => {
  if (debug) console.debug('[BrioInputRootNode] subNodes', subNodes)

  return (
    <FlexCol gap={gap}>
      {subNodes.map(props => (
        <BrioInputNode key={props.id} gap={gap} ruleViolations={ruleViolations} {...props} />
      ))}
    </FlexCol>
  )
}
