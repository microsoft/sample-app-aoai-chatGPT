import { Button, FlexCol, Heading3, Icon, IconLock, Segment, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurity } from '../../context'

export const ForbiddenPage: FC = () => {
  const { isLoggedIn, logout } = useCurity()
  const { t } = useTranslation(['common', 'pages'])

  const onClick = () => {
    window.open(import.meta.env.VITE_CUSTOMER_SUPPORT_URL, '_blank')
  }

  const onLogout = () => logout()

  return (
    <FlexCol gap={24}>
      <FlexCol alignItems="center">
        <Heading3>{t('pages:forbiddenPage.heading1')}</Heading3>
        <Heading3>{t('pages:forbiddenPage.heading2')}</Heading3>
      </FlexCol>
      <Segment>
        <FlexCol alignItems="center" gap={24}>
          <Icon size={64} icon={IconLock} />
          <FlexCol alignItems="center" gap={16}>
            <Text variant="label1">{t('pages:forbiddenPage.paragraph1')}</Text>
            <Text textAlign="center" variant="subtitle2">
              {t('pages:forbiddenPage.paragraph2')}
            </Text>
          </FlexCol>
          <FlexCol width="full" gap={8}>
            <Button variant="primary" size="medium" width="full" onClick={onClick}>
              {t('pages:forbiddenPage.button')}
            </Button>
            {isLoggedIn && (
              <Button variant="tertiary" size="medium" width="full" onClick={onLogout}>
                {t('common:verbs.logout')}
              </Button>
            )}
          </FlexCol>
        </FlexCol>
      </Segment>
    </FlexCol>
  )
}
