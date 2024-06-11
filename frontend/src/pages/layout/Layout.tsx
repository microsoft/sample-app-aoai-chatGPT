import { Outlet } from "react-router-dom";
import MSFTLogoWhite from "../../assets/msft_logo_white.png";
import MSFTLogoGrey from "../../assets/msft_logo_gray.png";
import { useContext, useEffect, useState } from "react";
import { AppStateContext } from "../../state/AppProvider";
import { Header } from "../../components/Header/Header";
import { LayoutStyles } from "./LayoutStyles";
import Footer from "../../components/Footer/Footer";

const Layout = ({ isDarkTheme, embedDisplay }: { isDarkTheme: boolean, embedDisplay: boolean  }) => {
    const styles = LayoutStyles();
    const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false);
    const [copyClicked, setCopyClicked] = useState<boolean>(false);
    const [copyText, setCopyText] = useState<string>("Copy URL");
    const appStateContext = useContext(AppStateContext);
    const [LogoImage, setLogoImage] = useState<string>(isDarkTheme ? MSFTLogoWhite : MSFTLogoGrey);

    
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
        <div className={ embedDisplay ? styles.containerEmbed : styles.container}>
            {
                !embedDisplay && <Header
                azureImageUrl={LogoImage}
                onShareClick={handleShareClick}
                onHistoryClick={handleHistoryClick}
                appStateContext={appStateContext}
            />
            }
            <Outlet />
            {
                !embedDisplay && <Footer />
            }
        </div>
    );
};

export default Layout;
