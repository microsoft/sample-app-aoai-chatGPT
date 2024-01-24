import { Outlet } from "react-router-dom";
import LogoImage from "../../assets/chatIcon.svg";
import { useContext, useEffect, useState } from "react";
import { AppStateContext } from "../../state/AppProvider";
import { Header } from "../../components/Header/Header";
import { LayoutStyles } from "./LayoutStyles";
import Footer from "../../components/Footer/Footer";

const Layout = () => {
    const styles = LayoutStyles();
    const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false);
    const [copyClicked, setCopyClicked] = useState<boolean>(false);
    const [copyText, setCopyText] = useState<string>("Copy URL");
    const appStateContext = useContext(AppStateContext)

    const handleShareClick = () => {
        setIsSharePanelOpen(true);
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
                azureImageUrl={LogoImage}
                onShareClick={handleShareClick}
                onHistoryClick={handleHistoryClick}
                appStateContext={appStateContext}
            />
            <Outlet />
            <Footer />
        </div>
    );
};

export default Layout;
