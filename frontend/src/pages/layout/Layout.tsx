import { Outlet, Link } from "react-router-dom";
import { CopyRegular, ShareRegular } from "@fluentui/react-icons";
import {
  Dialog,
  Stack,
  TextField,
  ICommandBarStyles,
  IButtonStyles,
} from "@fluentui/react";
import { useContext, useEffect, useState } from "react";
import styles from "./Layout.module.css";
import Contoso from "../../assets/eic-arrow-logo-dark-1.png";
import { HistoryButton, ShareButton } from "../../components/common/Button";
import { AppStateContext } from "../../state/AppProvider";
import { CosmosDBStatus } from "../../api";

const Layout = () => {
  const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false);
  const [copyClicked, setCopyClicked] = useState<boolean>(false);
  const [copyText, setCopyText] = useState<string>("Copy URL");
  const appStateContext = useContext(AppStateContext);

  // Example chat histories - replace this with your dynamic data
  const chatHistories = ["Chat 1", "Chat 2", "Chat 3", "Chat 4"];

  const handleShareClick = () => {
    setIsSharePanelOpen(true);
  };

  const handleSharePanelDismiss = () => {
    setIsSharePanelOpen(false);
    setCopyClicked(false);
    setCopyText("Copy URL");
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyClicked(true);
  };

  const handleHistoryClick = () => {
    appStateContext?.dispatch({ type: "TOGGLE_CHAT_HISTORY" });
  };

  useEffect(() => {
    if (copyClicked) {
      setCopyText("Copied URL");
    }
  }, [copyClicked]);

  useEffect(() => {}, [appStateContext?.state.isCosmosDBAvailable.status]);

  return (
    // <div className={styles.layoutWithSidebar}>
    //   <aside className={styles.sidebar}>
    //     <button className={styles.newConversationButton}>
    //       New Conversation
    //     </button>
    //     <div className={styles.chatHistoryList}>
    //       {chatHistories.map((chat, index) => (
    //         <div key={index} className={styles.chatHistoryItem}>
    //           {chat}
    //         </div>
    //       ))}
    //     </div>
    //     <div className={styles.profileMenu}>
    //       <div className={styles.profileMenuItem}>Profile</div>
    //       <div className={styles.profileMenuItem}>Settings</div>
    //       <div className={styles.profileMenuItem}>Logout</div>
    //     </div>
    //   </aside>
    //   {/* <div className={styles.mainContent}> */}
    //   <div className={styles.layout} >
    //     <header className={styles.header} role={"banner"}>
    //       <Stack
    //         horizontal
    //         verticalAlign="center"
    //         horizontalAlign="space-between"
    //       >
    //         {/* Header content remains unchanged */}
    //       </Stack>
    //     </header>
    //     <Outlet />
    //     <Dialog
    //       onDismiss={handleSharePanelDismiss}
    //       hidden={!isSharePanelOpen}
    //       styles={{
    //         main: [
    //           {
    //             selectors: {
    //               ["@media (min-width: 480px)"]: {
    //                 maxWidth: "600px",
    //                 background: "#FFFFFF",
    //                 boxShadow:
    //                   "0px 14px 28.8px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.2)",
    //                 borderRadius: "8px",
    //                 // maxHeight: '200px',
    //                 // minHeight: '100px',
    //               },
    //             },
    //           },
    //         ],
    //       }}
    //       dialogContentProps={{
    //         title: "Share the web app",
    //         showCloseButton: true,
    //       }}
    //     >
    //       <Stack
    //         horizontal
    //         verticalAlign="center"
    //         tokens={{ childrenGap: 8 }}
    //         style={{ gap: "8px" }}
    //       >
    //         <TextField
    //           className={styles.urlTextBox}
    //           defaultValue={window.location.href}
    //           readOnly
    //           underlined
    //         />
    //         <div
    //           className={styles.copyButtonContainer}
    //           role="button"
    //           tabIndex={0}
    //           aria-label="Copy"
    //           onClick={handleCopyClick}
    //           onKeyDown={(e) =>
    //             e.key === "Enter" || e.key === " " ? handleCopyClick() : null
    //           }
    //           style={{
    //             display: "flex",
    //             alignItems: "center",
    //             cursor: "pointer",
    //           }}
    //         >
    //           <CopyRegular className={styles.copyButton} />
    //           <span className={styles.copyButtonText}>{copyText}</span>
    //         </div>
    //       </Stack>
    //     </Dialog>
    //   </div>
    // </div>

    <div className={styles.layout}>
      <header className={styles.header} role={"banner"}>
        <Stack
          horizontal
          verticalAlign="center"
          horizontalAlign="space-between"
        >
          <Stack horizontal verticalAlign="center">
            <img
              src={Contoso}
              className={styles.headerIcon}
              aria-hidden="true"
              alt="eInfochips Eragon Co-Pilot Logo"
            />
            <Link
              to="/"
              className={styles.headerTitleContainer}
              aria-label="eInfochips Eragon Co-Pilot Home"
            >
              <h1 className={styles.headerTitle}>eInfochips Eragon Co-Pilot</h1>
            </Link>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 10 }}>
            {appStateContext?.state.isCosmosDBAvailable?.status !==
              CosmosDBStatus.NotConfigured && (
              <HistoryButton
                onClick={handleHistoryClick}
                text={
                  appStateContext?.state?.isChatHistoryOpen
                    ? "Hide chat history"
                    : "Show chat history"
                }
              />
            )}
            <ShareButton onClick={handleShareClick} />
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
                ["@media (min-width: 480px)"]: {
                  maxWidth: "600px",
                  background: "#FFFFFF",
                  boxShadow:
                    "0px 14px 28.8px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.2)",
                  borderRadius: "8px",
                  // maxHeight: '200px',
                  // minHeight: '100px',
                },
              },
            },
          ],
        }}
        dialogContentProps={{
          title: "Share the web app",
          showCloseButton: true,
        }}
      >
        <Stack
          horizontal
          verticalAlign="center"
          tokens={{ childrenGap: 8 }}
          style={{ gap: "8px" }}
        >
          <TextField
            className={styles.urlTextBox}
            defaultValue={window.location.href}
            readOnly
            underlined
          />
          <div
            className={styles.copyButtonContainer}
            role="button"
            tabIndex={0}
            aria-label="Copy"
            onClick={handleCopyClick}
            onKeyDown={(e) =>
              e.key === "Enter" || e.key === " " ? handleCopyClick() : null
            }
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <CopyRegular className={styles.copyButton} />
            <span className={styles.copyButtonText}>{copyText}</span>
          </div>
        </Stack>
      </Dialog>
    </div>
  );
};

export default Layout;