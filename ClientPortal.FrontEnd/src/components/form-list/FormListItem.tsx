import { Card, ListItem, ListItemRow, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { QuestionnaireStatus } from '../../enums'
import { FormListItemAction } from './FormListItemAction'
import { FormListItemBadge } from './FormListItemBadge'

export type FormListItemProps = {
  label: string
  number: number
  status: QuestionnaireStatus
  title: string
  onClick(): void
}

export const FormListItem: FC<FormListItemProps> = ({ label, number, status, title, onClick }) => (
  <Card
    width="full"
    pt={8}
    pb={8}
    onClick={
      [QuestionnaireStatus.ManualHandlingRequired, QuestionnaireStatus.Creating, QuestionnaireStatus.PreCreation].includes(status)
        ? undefined
        : onClick
    }
  >
    <ListItem
      action={<FormListItemAction status={status} />}
      support={<FormListItemBadge number={number} status={status} />}
    >
      <ListItemRow
        title={
          <Text variant="support2" color="text-low-emphasis">
            {label}
          </Text>
        }
      />
      <ListItemRow title={<Text variant="subtitle1">{title}</Text>} />
    </ListItem>
  </Card>
)
