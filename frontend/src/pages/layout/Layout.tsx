import React, { useContext, useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Dialog } from '@fluentui/react';
import { CopyRegular } from '@fluentui/react-icons';
import { CosmosDBStatus } from '../../api';
import KrillLogo from '../../assets/KrillLogo.svg';
import { AppStateContext } from '../../state/AppProvider';
import styles from './Layout.module.css';

const Layout: React.FC = () => {
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [copyText, setCopyText] = useState('Copy URL');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const appStateContext = useContext(AppStateContext);

  const handleShareClick = () => setIsSharePanelOpen(true);
  const handleSharePanelDismiss = () => {
    setIsSharePanelOpen(false);
    setCopyText('Copy URL');
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy URL'), 2000);
  };

  const handleHistoryClick = () => {
    appStateContext?.dispatch({ type: 'TOGGLE_CHAT_HISTORY' });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link to="/" className={styles.headerTitleContainer}>
            <img src={KrillLogo} className={styles.headerIcon} alt="Krill Arctic Foods Logo" />
            <h1 className={styles.headerTitle}>Antarctic Krill Chat</h1>
          </Link>
          <div className={styles.buttonContainer}>
            {appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured && (
              <button className={styles.button} onClick={handleHistoryClick}>
                {appStateContext?.state?.isChatHistoryOpen
                  ? (isMobile ? 'Hide' : 'Hide History')
                  : (isMobile ? 'Show' : 'Show History')}
              </button>
            )}
            <button className={styles.button} onClick={handleShareClick}>
              {isMobile ? 'Share' : 'Share Chat'}
            </button>
          </div>
        </div>
      </header>
      <Outlet />
      <Dialog
        hidden={!isSharePanelOpen}
        onDismiss={handleSharePanelDismiss}
        dialogContentProps={{
          title: 'Share Antarctic Krill Chat',
          subText: 'Copy the link to share this chat',
        }}
        modalProps={{
          styles: { main: { maxWidth: 450 } },
        }}
      >
        <div className={styles.shareDialog}>
          <input
            type="text"
            className={styles.urlTextBox}
            value={window.location.href}
            readOnly
          />
          <button className={styles.copyButton} onClick={handleCopyClick}>
            <CopyRegular className={styles.copyIcon} />
            {copyText}
          </button>
        </div>
      </Dialog>
    </div>
  );
};

export default Layout;