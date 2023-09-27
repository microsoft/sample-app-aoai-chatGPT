import { SkeletonRect } from '@carnegie/duplo'
import { FC } from 'react'
import { ErrorBanner } from '../components/banners/ErrorBanner'
import { BrioReadQuestionnaire } from '../components/brio'
import { useQuestionnaire } from '../hooks/react-query/use-questionnaire'
import { QuestionnairePage } from '../types'
import { convertSubnodes } from '../utils/trapets'

type Props = {
  customerId: number
  debug?: boolean
  questionnaireId: number
}

export const TrapetsReadContainer: FC<Props> = ({ customerId, debug = false, questionnaireId }) => {
  const { isLoading, data, error } = useQuestionnaire(customerId, questionnaireId)

  if (isLoading) {
    return <SkeletonRect height={500} width="full" />
  }

  if (error) {
    return <ErrorBanner debug={debug} error={error} />
  }

  if (!data) {
    return <ErrorBanner error={new Error('Questionnaire not found')} />
  }

  // TODO: #123692 - Arbeta bort så det inte behövs tomma sidor i trapets...
  // removing empty pages, should probably be added by us and not in trapets if needed.
  const pages = data.pages.reduce((acc: QuestionnairePage[], page) => {
    if (page.rootNode.subNodes?.length) acc.push(page)
    return acc
  }, [])

  return (
    <BrioReadQuestionnaire
      debug={debug}
      pages={pages.map(page => ({
        ...page,
        rootNode: {
          ...page.rootNode,
          subNodes: convertSubnodes(page.rootNode.subNodes),
        },
      }))}
    />
  )
}
