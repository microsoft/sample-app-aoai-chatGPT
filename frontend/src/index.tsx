import React from "react";
import ReactDOM from "react-dom/client";
import {HashRouter, Routes, Route} from "react-router-dom";
import {initializeIcons, loadTheme} from "@fluentui/react";

import "./index.css";

import Layout from "./pages/layout/Layout";
import NoPage from "./pages/NoPage";
import Chat from "./pages/chat/Chat";
import {AppStateProvider} from "./state/AppProvider";

initializeIcons();

loadTheme({
    palette: {
        themePrimary: "#37772F",
        themeSecondary: "#37772F",
        themeTertiary: "#37772F",
    }
})

export default function App() {
    return (
        <AppStateProvider>
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Layout/>}>
                        <Route index element={<Chat/>}/>
                        <Route path="*" element={<NoPage/>}/>
                    </Route>
                </Routes>
            </HashRouter>
        </AppStateProvider>
    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);
