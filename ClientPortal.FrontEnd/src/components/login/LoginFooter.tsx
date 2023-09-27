import { Flex, FlexCol, Icon, IconExternalLink, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const LoginFooter: FC = () => {
  const { t } = useTranslation('components', { keyPrefix: 'loginFooter' })

  return (
    <FlexCol pb={8}>
      <Text variant="support1" pb={2}>
        {t('title')}
      </Text>
      <Flex pb={8}>
        <a
          href={'https://www.carnegie.se/behandling-av-personuppgifter/'}
          target="_blank"
          rel="noreferrer"
        >
          <Text variant="subtitle2">
            {t('policy')} <Icon size={16} color={'text-link'} icon={IconExternalLink} />
          </Text>
        </a>
      </Flex>
      <Flex pb={16}>
        <a href={'https://support.bankid.com/sv'} target="_blank" rel="noreferrer">
          <Text variant="subtitle2">
            {t('helpWithBankId')} <Icon size={16} color={'text-link'} icon={IconExternalLink} />
          </Text>
        </a>
      </Flex>
    </FlexCol>
  )
}
