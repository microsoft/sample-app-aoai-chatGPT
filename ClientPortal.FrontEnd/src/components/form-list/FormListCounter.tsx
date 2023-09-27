import { Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { QuestionnaireStatus } from '../../enums'
import { FormListItemProps } from './FormListItem'

type Props = {
  forms: Array<Partial<FormListItemProps>>
}

export const FormListCounter: FC<Props> = ({ forms }) => {
  const { t } = useTranslation('components')

  const total = forms.length
  const done = forms.filter(x => x.status === QuestionnaireStatus.Done).length

  return (
    <Text variant="support2">
      {done === total
        ? t('formList.listCounterAllDone')
        : t('formList.listCounter', { done, total })}
    </Text>
  )
}
