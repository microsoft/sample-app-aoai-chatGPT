import { Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { QuestionnaireStatus } from '../../enums'
import { FormListItemProps } from './FormListItem'

type Props = {
  forms: Array<Partial<FormListItemProps>>
}

export const FormListHelpText: FC<Props> = ({ forms }) => {
  const { t } = useTranslation('components')

  if (forms.some(x => x.status === QuestionnaireStatus.Creating)) {
    return <Text variant="body2">{t('formList.formInitialisingText')}</Text>
  }

  if (forms.some(x => x.status === QuestionnaireStatus.ManualHandlingRequired)) {
    return <Text variant="body2">{t('formList.manualHandlingRequiredText')}</Text>
  }

  return null
}
