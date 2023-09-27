import {
  Box,
  Flex,
  IconButton,
  IconFlagSweden,
  IconFlagUk,
  IconLogin,
  IconLogout,
  IconUser,
  Link,
  Menu,
  MenuHeader,
  MenuItem,
  MenuItems,
  MenuToggle,
  Text,
} from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { CarnegieLogoSmall } from '../../assets/CarnegieLogoSmall'
import { safelyParse } from '../../utils/safely-parse'

type Props = {
  displayName?: string
  isLoading: boolean
  isLoggedIn: boolean
  language: string
  onLogin(): void
  onLogout(): void
  setLanguage(language: string): void
}

export const CarnegieHeader: FC<Props> = ({
  displayName,
  isLoading,
  isLoggedIn,
  language,
  onLogin,
  onLogout,
  setLanguage,
}) => {
  const { t } = useTranslation('common')

  return (
    <Flex
      alignItems="center"
      height={56}
      justifyContent="space-between"
      className="test-page-header"
      css={{
        background: 'linear-gradient(100deg, #212D40 45%, #0A0E13 55%)',
      }}
    >
      <Flex pl={32}>
        <Link width={96} height={32} display="block" to="/">
          <CarnegieLogoSmall />
        </Link>
      </Flex>
      <Flex alignItems="center" justifyContent="space-between" pr={24}>
        {isLoggedIn && (
          <Text color="regent-st-500" variant="support1" pr={16}>
            {displayName}
          </Text>
        )}
        <Menu>
          <MenuToggle>
            <IconButton
              color="regent-st-100"
              disabled={false}
              icon={IconUser}
              size="large"
              variant="uncontained"
              aria-label="user-profile"
              className="test-menu-toggle-button"
            />
          </MenuToggle>
          <MenuItems>
            {isLoggedIn ? (
              <Box>
                <MenuHeader>{t('nouns.user')}</MenuHeader>
                <MenuItem icon={IconLogout} onClick={onLogout}>
                  {t('verbs.logout')}
                </MenuItem>
              </Box>
            ) : isLoading ? (
              <Box pr={16}>
                <MenuHeader>{t('nouns.loading')}</MenuHeader>
              </Box>
            ) : (
              <Box>
                <MenuHeader>{t('nouns.user')}</MenuHeader>
                <MenuItem icon={IconLogin} onClick={onLogin}>
                  {t('verbs.login')}
                </MenuItem>
              </Box>
            )}
            <MenuHeader>{t('nouns.language')}</MenuHeader>
            {safelyParse(window.ENV?.USE_TRANSLATIONS) === true && (
              <MenuItem
                disabled={language === 'en'}
                icon={IconFlagUk}
                onClick={() => setLanguage('en')}
              >
                {t('languages.en')}
              </MenuItem>
            )}
            <MenuItem
              disabled={language === 'sv'}
              icon={IconFlagSweden}
              onClick={() => setLanguage('sv')}
            >
              {t('languages.sv')}
            </MenuItem>
          </MenuItems>
        </Menu>
      </Flex>
    </Flex>
  )
}
