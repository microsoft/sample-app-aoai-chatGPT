import { Flex, FlexCol, Heading6 } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { FormListCounter } from './FormListCounter'
import { FormListHelpText } from './FormListHelpText'
import { FormListItem, FormListItemProps } from './FormListItem'
import { QuestionnaireItemOrigin } from '../../enums'

export type FormItem = Omit<FormListItemProps, 'number'> & {
  sortOrder: number
  origin: QuestionnaireItemOrigin
}

type Props = {
  forms: FormItem[]
}

export const FormList: FC<Props> = ({ forms }) => {
  const { t } = useTranslation('components')

  if (!forms.length) return null

  return (
    <FlexCol gap={8}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading6>{t('formList.heading')}</Heading6>
        <FormListCounter forms={forms} />
      </Flex>
      <FlexCol gap={16}>
        {forms.sort((a,b) => a.sortOrder - b.sortOrder).map((x, index) => (
          <FormListItem
            key={`${x.label}__${x.title}`}
            label={x.label}
            number={index + 1}
            status={x.status}
            title={x.title}
            onClick={x.onClick}
          />
        ))}
      </FlexCol>
      <FormListHelpText forms={forms} />
    </FlexCol>
  )
}
