import { Badge, Icon, IconCheckmark } from '@carnegie/duplo'
import { FC } from 'react'
import { QuestionnaireStatus } from '../../enums'

type Props = {
  number: number
  status: QuestionnaireStatus
}

export const FormListItemBadge: FC<Props> = ({ number, status }) => {
  switch (status) {
    case QuestionnaireStatus.PreCreation:
    case QuestionnaireStatus.Creating:
      return (
        <Badge backgroundColor="text-disabled" size="large">
          {number}
        </Badge>
      )

    case QuestionnaireStatus.Done:
      return (
        <Badge backgroundColor="status-success" size="large">
          <Icon icon={IconCheckmark} color="off-white" />
        </Badge>
      )

    case QuestionnaireStatus.ManualHandlingRequired:
      return (
        <Badge backgroundColor="status-warning" size="large">
          {number}
        </Badge>
      )

    default:
      return (
        <Badge backgroundColor="text-positive" size="large">
          {number}
        </Badge>
      )
  }
}
