import {
  Banner,
  Box,
  Checkbox,
  FlexCol,
  Heading6,
  Icon,
  IconExternalLink,
  LinkExternal,
  Text,
} from '@carnegie/duplo'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountState } from '../../types/bff/account'
import { isAgreementSigned } from '../../utils/account/account-state'
import { BrioNext } from '../brio/navigation/BrioNext'

interface AccountPolicyProps {
  isLoading: boolean
  accountStateItem: AccountState
}

export const AccountPolicy: FC<AccountPolicyProps> = ({ isLoading, accountStateItem }) => {
  const { t } = useTranslation('components', { keyPrefix: 'accountPolicy' })
  const [policyAccepted, setPolicyAccepted] = useState(false)

  return (
    <FlexCol space={16}>
      {isAgreementSigned(accountStateItem.state) && (
        <Banner
          title={t('agreementSignedTitle')}
          description={
            <Text variant="body2">
              <span>{t('agreementSignedText')}</span>
              <LinkExternal href={window.ENV?.PB_ONLINE_LOGIN_URL} target="_self" rel="noopener">
                <Text variant="subtitle1">{t('clickHere')}</Text>
              </LinkExternal>
            </Text>
          }
          severity="success"
        />
      )}
      {isLoading && (
        <Banner
          title={t('pendingAgreementTitle')}
          description={
            <Text variant="body2">
              <span>{t('pendingAgreementText')}</span>
              <LinkExternal
                href={accountStateItem.loginUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Text variant="subtitle1">{t('clickHere')}</Text>
              </LinkExternal>
            </Text>
          }
          severity="information"
        />
      )}
      <Heading6>{t('priceListHeader')}</Heading6>
      <Text mb={16} variant="support1">
        {t('priceListText')}
      </Text>
      <LinkExternal
        href="https://www.carnegie.se/app/uploads/2021/05/Prislista-privattjanst-sv.pdf"
        target="_blank"
        rel="noopener"
      >
        <Text variant="subtitle2">{t('priceListLink')}</Text>
        <Icon size={16} color="current" ml={4} icon={IconExternalLink} />
      </LinkExternal>
      <Heading6>{t('depositHeader')}</Heading6>
      <Text variant="support1">{t('depositText')}</Text>
      <LinkExternal
        href="https://www.riksgalden.se/sv/var-verksamhet/insattningsgarantin-och-investerarskyddet/sa-fungerar-insattningsgarantin/"
        target="_blank"
        rel="noopener"
      >
        <Text variant="subtitle2">{t('depositLink')}</Text>
        <Icon size={16} color="current" ml={4} icon={IconExternalLink} />
      </LinkExternal>
      {!isAgreementSigned(accountStateItem.state) && (
        <>
          <Box borderRadius={4} p={8} backgroundColor="off-white" border="medium">
            <Checkbox
              label={t('acceptDepositLabel')}
              checked={policyAccepted || isLoading}
              onChange={e => setPolicyAccepted(e.target.checked)}
              disabled={isLoading}
            />
          </Box>
          <BrioNext text="#SignAgreement#" disabled={!policyAccepted} loading={isLoading} />
        </>
      )}
    </FlexCol>
  )
}
