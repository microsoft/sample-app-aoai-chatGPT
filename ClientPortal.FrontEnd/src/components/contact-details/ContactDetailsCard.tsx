import { Card, Flex, FlexCol, Icon, IconAtSign, IconEdit, IconPhone, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { ContactDetailsItem } from './ContactDetailsItem'

type Props = {
  email?: string
  phoneNumber?: string
  onClick?(): void
}

export const ContactDetailsCard: FC<Props> = ({ email, phoneNumber, onClick }) => {
  const { t } = useTranslation(['common', 'components'])

  return (
    <Card
      id="contactDetailsCard"
      pl={16}
      pr={16}
      width="full"
      onClick={onClick}
      css={{
        paddingTop: '20px',
        paddingBottom: '20px',
      }}
    >
      <Flex alignItems="center" justifyContent="space-between" pb={8}>
        <Text variant="subtitle1">{t('components:contactDetailsCard.title')}</Text>
        {onClick && <Icon icon={IconEdit} />}
      </Flex>
      <FlexCol alignItems="flex-start" gap={4}>
        <ContactDetailsItem icon={IconPhone} value={phoneNumber} />
        <ContactDetailsItem icon={IconAtSign} value={email} />
      </FlexCol>
    </Card>
  )
}
