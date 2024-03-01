import { Outlet, Link } from "react-router-dom";
import {
  CopyRegular,
  ShareRegular,
  ShieldLockRegular,
} from "@fluentui/react-icons";
import { FaUserCircle } from "react-icons/fa";
import { MdContactMail } from "react-icons/md";
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
import { CosmosDBStatus, getUserInfo } from "../../api";

const Layout = () => {
  const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false);
  const [copyClicked, setCopyClicked] = useState<boolean>(false);
  const [copyText, setCopyText] = useState<string>("Copy URL");
  const appStateContext = useContext(AppStateContext);
  const AUTH_ENABLED = appStateContext?.state.frontendSettings?.auth_enabled;
  const [showAuthMessage, setShowAuthMessage] = useState<boolean>(true);
  const [userName, setUserName] = useState("");

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

  const getUserInfoList = async () => {
    if (!AUTH_ENABLED) {
      setShowAuthMessage(false);
      return;
    }
    const userInfoList = await getUserInfo();

    let nameObj = userInfoList[0].user_claims.find(
      (claim) => claim.typ === "name"
    );

    let value = nameObj ? nameObj.val : "Default Name";
    setUserName(value);

    if (userInfoList.length === 0 && window.location.hostname !== "127.0.0.1") {
      setShowAuthMessage(true);
    } else {
      setShowAuthMessage(false);
    }
  };

  useEffect(() => {
    if (AUTH_ENABLED !== undefined) getUserInfoList();
  }, [AUTH_ENABLED]);

  useEffect(() => {
    if (copyClicked) {
      setCopyText("Copied URL");
    }
  }, [copyClicked]);

  useEffect(() => {}, [appStateContext?.state.isCosmosDBAvailable.status]);

  return (
    <div className={styles.layout}>
      {showAuthMessage ? (
        <Stack className={styles.chatEmptyState}>
          <ShieldLockRegular
            className={styles.chatIcon}
            style={{ color: "darkorange", height: "200px", width: "200px" }}
          />
          <h1 className={styles.chatEmptyStateTitle}>
            Authentication Not Configured
          </h1>
          <h2 className={styles.chatEmptyStateSubtitle}>
            This app does not have authentication configured. Please add an
            identity provider by finding your app in the
            <a href="https://portal.azure.com/" target="_blank">
              {" "}
              Azure Portal{" "}
            </a>
            and following
            <a
              href="https://learn.microsoft.com/en-us/azure/app-service/scenario-secure-app-authentication-app-service#3-configure-authentication-and-authorization"
              target="_blank"
            >
              {" "}
              these instructions
            </a>
            .
          </h2>
          <h2
            className={styles.chatEmptyStateSubtitle}
            style={{ fontSize: "20px" }}
          >
            <strong>
              Authentication configuration takes a few minutes to apply.{" "}
            </strong>
          </h2>
          <h2
            className={styles.chatEmptyStateSubtitle}
            style={{ fontSize: "20px" }}
          >
            <strong>
              If you deployed in the last 10 minutes, please wait and reload the
              page after 10 minutes.
            </strong>
          </h2>
        </Stack>
      ) : (
        <>
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
              <div className={styles.historyDiv}>
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
                      <MdVisibility className={styles.historyIcon} />
                    ) : (
                      <MdVisibilityOff className={styles.historyIcon} />
                    )}
                  </HistoryButton>
                )}
              </div>
              <div className={styles.userDiv}>
                {userName && (
                  <ContactUsButton text={userName}></ContactUsButton>
                  // <div className={styles.usercontainer}>
                  //   {/* <div className={styles.userIcon}>
                  //   <FaUserCircle className={styles.userIcon}/>
                  // </div> */}
                  //   <div className={styles.username}>{userName}</div>
                  // </div>
                )}
              </div>

              {/* <a
                    href="mailto:sarthak.shah@einfochips.com"
                    style={{ textDecoration: "none" }}
                  >
                    <ContactUsButton
                      onClick={handleContactUsClick}
                      text="Contact Us"
                    ></ContactUsButton>
                  </a> */}
            </div>
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
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <CopyRegular className={styles.copyButton} />
            <span className={styles.copyButtonText}>{copyText}</span>
          </div>
        </Stack>
      </Dialog>
      <div style={{ position: "relative", padding: "10px 20px" }}>
        <a
          href="mailto:sarthak.shah@einfochips.com"
          style={{
            textDecoration: "none",
            position: "absolute",
            bottom: "0",
            right: "0",
            marginRight: "20px",
          }}
          // className={styles.anchor}
        >
          <MdContactMail
            style={{
              color: "#FFFFFF",
              background:
                "radial-gradient(109.81% 107.82% at 100.1% 90.19%, #0F6CBD 33.63%, #2D87C3 70.31%, #8DDDD8 100%)",
              height: 30,
              width: 30,
              marginRight: 20,
            }}
            className={
              appStateContext?.state.isCosmosDBAvailable?.status !==
              CosmosDBStatus.NotConfigured
                ? styles.clearChatBroom
                : styles.clearChatBroomNoCosmos
            }
          />
          {/* Share Your Feedback */}
        </a>
      </div>
      </>
      )}
    </div>
  );
};

export default Layout;
