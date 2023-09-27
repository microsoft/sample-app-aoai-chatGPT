import { FlexRow, Icon, IconDef, SvgComponent, Tag, TagLabel, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  icon: IconDef | SvgComponent
  value?: string
}

export const ContactDetailsItem: FC<Props> = ({ icon, value }) => {
  const { t } = useTranslation('common')

  return (
    <FlexRow alignItems="flex-start">
      <Icon icon={icon} pr={4} />
      {value ? (
        <Text variant="body2">{value}</Text>
      ) : (
        <Tag size="SMALL" type="POSITIVE">
          <TagLabel>{t('nouns.missing')}</TagLabel>
        </Tag>
      )}
    </FlexRow>
  )
}
