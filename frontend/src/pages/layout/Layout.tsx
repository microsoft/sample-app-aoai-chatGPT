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
import { MdVisibility } from "react-icons/md";
import { MdVisibilityOff } from "react-icons/md";
import styles from "./Layout.module.css";
import Contoso from "../../assets/eic-arrow-logo-dark-1.png";
import { HistoryButton, ContactUsButton } from "../../components/common/Button";
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

  const handleContactUsClick = () => {
    console.log("Clicked");
  };

  useEffect(() => {
    if (copyClicked) {
      setCopyText("Copied URL");
    }
  }, [copyClicked]);

  useEffect(() => {}, [appStateContext?.state.isCosmosDBAvailable.status]);

  return (
    <div className={styles.layout}>
      <header className={styles.header} role={"banner"}>
        <Stack
          className={styles.customStack}
          horizontal
          verticalAlign="center"
          horizontalAlign="end"
        >
          <Stack horizontal verticalAlign="center">

            <div className={styles.headerIconMain}>
              <img
                src={Contoso}
                className={styles.headerIcon}
                aria-hidden="true"
                alt="eInfochips Co-Pilot Logo"
              />
            </div>

            <div className={styles.centerHeader}>
              <Link
                to="/"
                className={styles.headerTitleContainer}
                aria-label="eInfochips Copilot - FAE's Personal AI Assistant"
              >
                <h1 className={styles.headerTitle}>
                  eInfochips Copilot - FAE's Personal AI Assistant
                </h1>
              </Link>
            </div>
            <div className={styles.buttonDiv}>
              {appStateContext?.state.isCosmosDBAvailable?.status !==
                CosmosDBStatus.NotConfigured && (
                <HistoryButton
                  onClick={handleHistoryClick}
                  text={
                    appStateContext?.state?.isChatHistoryOpen
                      ? "Hide chat history"
                      : "Show chat history"
                  }
                >
                  {appStateContext?.state?.isChatHistoryOpen ? (
                    <MdVisibility />
                  ) : (
                    <MdVisibilityOff />
                  )}
                </HistoryButton>
              )}
              <a href="mailto:sarthak.shah@einfochips.com" style={{ textDecoration: 'none' }}>
                <ContactUsButton
                  onClick={handleContactUsClick}
                  text="Contact Us"
                ></ContactUsButton>
              </a>
            </div>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 10 }}>
            {/* {appStateContext?.state.isCosmosDBAvailable?.status !==
              CosmosDBStatus.NotConfigured && (
              <HistoryButton
                onClick={handleHistoryClick}
                text={
                  appStateContext?.state?.isChatHistoryOpen
                    ? "Hide chat history"
                    : "Show chat history"
                }
              >
                {appStateContext?.state?.isChatHistoryOpen ? (
                  <MdVisibility />
                ) : (
                  <MdVisibilityOff />
                )}
              </HistoryButton>
            )}

            <ContactUsButton
              onClick={handleContactUsClick}
              text="Contact Us"
            ></ContactUsButton> */}

            {/* <button
              className={styles.contactUsButton}
              title="Contact Us"
            >Contact Us</button> */}
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
