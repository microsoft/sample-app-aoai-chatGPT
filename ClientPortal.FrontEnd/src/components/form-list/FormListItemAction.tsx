import { Icon, IconChevronRight } from '@carnegie/duplo'
import { FC } from 'react'
import { QuestionnaireStatus } from '../../enums'

type Props = {
  status: QuestionnaireStatus
}

export const FormListItemAction: FC<Props> = ({ status }) => {
  switch (status) {
    case QuestionnaireStatus.PreCreation:
    case QuestionnaireStatus.Creating:
    case QuestionnaireStatus.ManualHandlingRequired:
      return null

    default:
      return <Icon icon={IconChevronRight} color="text-link" />
  }
}
