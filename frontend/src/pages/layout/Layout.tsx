import { useContext, useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Dialog, Stack, TextField } from '@fluentui/react'
import { CopyRegular } from '@fluentui/react-icons'
import { List } from 'react-bootstrap-icons'
import { BiHide, BiShowAlt } from "react-icons/bi";

import { CosmosDBStatus } from '../../api'
import Contoso from '../../assets/Contoso.svg'
import { HistoryButton, ShareButton } from '../../components/common/Button'
import { AppStateContext } from '../../state/AppProvider'
import SidebarMenu from '../../components/Sidebar/Sidebar'
import styles from './Layout.module.css'
import css from '../../components/common/Button.module.css'
import logo from "../../assets/asg_logo_animado2.gif"

const Layout = () => {
  const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false)
  const [copyClicked, setCopyClicked] = useState<boolean>(false)
  const [copyText, setCopyText] = useState<string>('Copiar URL')
  const [shareLabel, setShareLabel] = useState<string | undefined>('Compartir')
  const [hideHistoryLabel, setHideHistoryLabel] = useState<string>('Historial')
  const [showHistoryLabel, setShowHistoryLabel] = useState<string>('Historial')
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [toggled, setToggled] = useState<boolean>(false)
  const appStateContext = useContext(AppStateContext)
  const ui = appStateContext?.state.frontendSettings?.ui

  const handleShareClick = () => {
    setIsSharePanelOpen(true)
  }

  const handleSharePanelDismiss = () => {
    setIsSharePanelOpen(false)
    setCopyClicked(false)
    setCopyText('Copiar URL')
  }

  const handleCopyClick = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopyClicked(true)
  }

  const handleHistoryClick = () => {
    appStateContext?.dispatch({ type: 'TOGGLE_CHAT_HISTORY' })
  }

  const handleCollapsedChange = () => {
    setCollapsed(!collapsed)
  }

  const handleToggleSidebar = (value: boolean) => {
    setToggled(value)
    // value === false? setHistoryLogo("<BiShowAlt />") : setHistoryLogo("<BiHide />") Joshua
  }

  useEffect(() => {
    if (copyClicked) {
      setCopyText('URL Copiado ')
    }
  }, [copyClicked])

  useEffect(() => { }, [appStateContext?.state.isCosmosDBAvailable.status])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setShareLabel(undefined)
        setHideHistoryLabel('Historial')
        setShowHistoryLabel('Historial')
      } else {
        setShareLabel('Compartir')
        setHideHistoryLabel('Historial')
        setShowHistoryLabel('Historial')
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <SidebarMenu
      collapsed={collapsed}
      toggled={toggled}
      handleToggleSidebar={handleToggleSidebar}
      handleCollapsedChange={handleCollapsedChange}>
      <div className={styles.layout}>
        <header className={styles.header} role={'banner'}>
          <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
            <Stack horizontal verticalAlign="center">
              <List
                size={40}
                className={styles.btnToggle}
                onClick={() => handleToggleSidebar(!toggled)}
                color="yellow"
              />

              {/* ASG Logo */}
              <img src={logo} className={styles.headerIcon} aria-hidden="true" alt="" />
              <Link to="/" className={styles.headerTitleContainer}>
                <h1 className={styles.headerTitle}>{ui?.title}</h1>
              </Link>
            </Stack>
            <Stack horizontal tokens={{ childrenGap: 4 }} className={css.shareButtonContainer}>
              {appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured && (
                // Show/Hide History Chat

                <button
                  className={`${css.historyButtonRoot} ${css.buttonStructure}`}
                  onClick={handleHistoryClick}>
                  {appStateContext?.state?.isChatHistoryOpen ? (
                    <><BiHide color="#fff" size="25px" /><span>{hideHistoryLabel}</span></>
                  ) : (
                    <><BiShowAlt color="#fff" size="25px" /><span>{showHistoryLabel}</span></>)}
                </button>

                // <HistoryButton
                //   onClick={handleHistoryClick}
                //   text={appStateContext?.state?.isChatHistoryOpen ? hideHistoryLabel : showHistoryLabel}
                // />
              )}
              {/* Share Button */}
              {ui?.show_share_button && <ShareButton onClick={handleShareClick} text={shareLabel} />}
            </Stack>
          </Stack>
        </header>
        <Outlet />
        <Dialog
          onDismiss={handleSharePanelDismiss}
          hidden={!isSharePanelOpen}
          styles={{
            main: [
              {
                selectors: {
                  ['@media (min-width: 480px)']: {
                    maxWidth: '600px',
                    background: '#FFFFFF',
                    boxShadow: '0px 14px 28.8px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    minHeight: '100px'
                  }
                }
              }
            ]
          }}
          dialogContentProps={{
            title: 'Comparte la aplicación web ',
            showCloseButton: true
          }}>
          <Stack horizontal verticalAlign="center" style={{ gap: '8px' }}>
            <TextField className={styles.urlTextBox} defaultValue={window.location.href} readOnly />
            <div
              className={`${css.copyButtonContainer} ${css.buttonStructure}` }
              role="button"
              tabIndex={0}
              aria-label="Copy"
              onClick={handleCopyClick}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ' ? handleCopyClick() : null)}>
              <CopyRegular />
              <span className={css.copyButtonText}>{copyText}</span>
            </div>
          </Stack>
        </Dialog>
      </div>
    </SidebarMenu>
  )
}

export default Layout
