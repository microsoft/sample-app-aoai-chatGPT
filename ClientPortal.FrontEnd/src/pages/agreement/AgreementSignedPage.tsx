import {
  Badge,
  ButtonLinkExternal,
  Flex,
  FlexCol,
  FlexRow,
  Heading3,
  Icon,
  IconCheckmark,
  Segment,
  Text,
} from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

export const AgreementSignedPage: FC = () => {
  const { t } = useTranslation('pages')

  const customBadgeSize = { style: { width: 54, height: 54 } }

  return (
    <FlexCol gap={32}>
      <Flex justifyContent="center" textAlign="center">
        <Heading3>{t('agreementSignedPage.heading')}</Heading3>
      </Flex>
      <Segment p={16}>
        <FlexCol space={32}>
          <FlexRow justifyContent="center">
            <Badge backgroundColor="status-success" {...customBadgeSize}>
              <Icon icon={IconCheckmark} color="off-white" size={40}></Icon>
            </Badge>
          </FlexRow>
          <FlexCol textAlign="center">
            <Text>{t('agreementSignedPage.successMessage')}</Text>
            <Text variant="subtitle1">{t('agreementSignedPage.heading')}</Text>
          </FlexCol>
          <FlexCol space={16}>
            <ButtonLinkExternal
              href={window.ENV?.PB_ONLINE_LOGIN_URL}
              variant="primary"
              size="medium"
              rel="noreferrer"
              target="_self"
            >
              {t('agreementSignedPage.pbOnlineButton')}
            </ButtonLinkExternal>
            {/* <Button variant="secondary" size="medium">
              {t('agreementSignedPage.downloadAppButton')}
            </Button> */}
          </FlexCol>
        </FlexCol>
      </Segment>
    </FlexCol>
  )
}
