import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Layout from "./pages/layout/Layout";
import NoPage from "./pages/NoPage";
import Chat from "./pages/chat/Chat";
import { AppStateProvider } from "./state/AppProvider";
import { FluentProvider, tokens } from "@fluentui/react-components";
import ThemeService from "./services/themeService";

export default function App() {
    const [embedDisplay, setEmbedDisplay] = React.useState<boolean>(false);
    // Create method to get embed=true from query string
    const getEmbedDisplay = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('embed') === 'true';
    }
    // Set embedDisplay state to true if embed=true is in query string
    React.useEffect(() => {
        setEmbedDisplay(getEmbedDisplay());
    }, []);
    // Create instance of themeservice 
    const themeService = new ThemeService();
    const currentTheme = themeService.getTheme(window.REACT_APP_THEME ? window.REACT_APP_THEME : undefined);
    const isDarkTheme =  themeService.isThemeDarkOrHighContrast(currentTheme);
    return (
        <AppStateProvider>
            <FluentProvider
                theme={currentTheme}
                style={{ minHeight: "100vh", backgroundColor: tokens.colorNeutralBackground3 }}
            >
                <HashRouter>
                    <Routes>
                        <Route path="/" element={<Layout isDarkTheme={isDarkTheme} embedDisplay={embedDisplay}/>}>
                            <Route index element={<Chat  embedDisplay={embedDisplay} />} />
                            <Route path="*" element={<NoPage />} />
                        </Route>
                    </Routes>
                </HashRouter>
            </FluentProvider>
        </AppStateProvider>
    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
