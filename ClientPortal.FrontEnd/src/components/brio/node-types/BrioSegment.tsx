import { FlexCol, Segment } from '@carnegie/duplo'
import { FC } from 'react'
import { BrioNode as BrioNodeProps } from '../../../types'
import { decodeBase64 } from '../../../utils/base64'
import { BrioInputLabel } from '../input/BrioInputLabel'
import { BrioInputNode } from '../input/BrioInputNode'

export const BrioSegment: FC<BrioNodeProps> = ({ id, text, helpText, subNodes }) => (
  <FlexCol gap={8}>
    <BrioInputLabel helpText={helpText} text={text} />
    <Segment title={decodeBase64(id)} noContentPadding headingVariant="overline" mb={8}>
      {subNodes?.map(subNode => (
        <BrioInputNode key={subNode.id} {...subNode} />
      ))}
    </Segment>
  </FlexCol>
)
