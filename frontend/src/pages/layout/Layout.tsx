import { Outlet } from "react-router-dom";
import Azure from "../../assets/Azure.svg";
import { Copy16Regular } from "@fluentui/react-icons";
import { useContext, useEffect, useState } from "react";
import { AppStateContext } from "../../state/AppProvider";
import { Header } from "../../components/Header/Header";
import { Button, Dialog, DialogBody, DialogSurface, DialogTitle, Input } from "@fluentui/react-components";
import { LayoutStyles } from "./LayoutStyles";

const Layout = () => {
    const styles = LayoutStyles();
    const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false);
    const [copyClicked, setCopyClicked] = useState<boolean>(false);
    const [copyText, setCopyText] = useState<string>("Copy URL");
    const appStateContext = useContext(AppStateContext)

    const handleShareClick = () => {
        setIsSharePanelOpen(true);
    };

    const handleSharePanelDismiss = () => {
        setIsSharePanelOpen(false);
        setCopyClicked(false);
        setCopyText("Copy URL");
    };



    const handleHistoryClick = () => {
        appStateContext?.dispatch({ type: 'TOGGLE_CHAT_HISTORY' })
    };

    useEffect(() => {
        if (copyClicked) {
            setCopyText("Copied URL");
        }
    }, [copyClicked]);

    useEffect(() => { }, [appStateContext?.state.isCosmosDBAvailable.status]);

    return (
        <div className={styles.container}>
            <Header
                azureImageUrl={Azure}
                onShareClick={handleShareClick}
                onHistoryClick={handleHistoryClick}
                appStateContext={appStateContext}
            />
            <Outlet />
        </div >
    );
};

export default Layout;
