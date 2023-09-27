import { FlexCol, Segment } from '@carnegie/duplo'
import { FC } from 'react'
import { QuestionnairePage } from '../../../types'
import { BrioReadRootNode } from './BrioReadRootNode'

type Props = {
  debug?: boolean
  pages: QuestionnairePage[]
}

export const BrioReadQuestionnaire: FC<Props> = ({ debug = false, pages }) => {
  if (debug) {
    console.debug('[BrioReadQuestionnaire] pages', pages)
  }

  return (
    <FlexCol gap={16}>
      {pages.map((page, index) => (
        <Segment
          title={page.rootNode.subNodes.find(x => x.nodeType === 'H3')?.text}
          headingVariant="overline"
          key={index}
        >
          <BrioReadRootNode debug={debug} subNodes={page.rootNode.subNodes} />
        </Segment>
      ))}
    </FlexCol>
  )
}
