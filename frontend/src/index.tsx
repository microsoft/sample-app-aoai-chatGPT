import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { initializeIcons, loadTheme } from "@fluentui/react";
import CookieConsent from "react-cookie-consent";

import "./index.css";

import Layout from "./pages/layout/Layout";
import NoPage from "./pages/NoPage";
import Chat from "./pages/chat/Chat";
import { AppStateProvider } from "./state/AppProvider";

import { ApplicationInsights } from "@microsoft/applicationinsights-web";

const cookieConsent = document.cookie
  .split("; ")
  .find((row) => row.startsWith("CookieConsent="));

const cookieValue = cookieConsent?.split("=")[1] ?? "false";

let appInsights = null;

if (cookieValue === "true") {
  appInsights = new ApplicationInsights({
    config: {
      connectionString:
        "InstrumentationKey=96abd1e3-8f7c-4012-b193-62b4bd278aa1;IngestionEndpoint=https://francecentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://francecentral.livediagnostics.monitor.azure.com/",
    },
  });
  appInsights.loadAppInsights();
  appInsights.trackPageView();
}

initializeIcons();

loadTheme({
  palette: {
    themePrimary: "#37772F",
    themeSecondary: "#37772F",
    themeTertiary: "#37772F",
    accent: "#37772F",
    black: "#454545",
    themeDarkAlt: "#37772F",
    themeDarker: "#37772F",
    themeDark: "#37772F",
    themeLighterAlt: "#effded",
    themeLighter: "#effded",
    themeLight: "#effded",
  },
});

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Chat />} />
            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </HashRouter>
      <CookieConsent
        enableDeclineButton
        onDecline={() => {
          window.location.reload();
        }}
        style={{ background: "#2B373B" }}
        buttonStyle={{
          background: "#37772F",
          color: "#effded",
          fontSize: "13px",
        }}
      >
        By clicking "I Understand", you consent to the use of cookies for
        performance and usage tracking purposes to enhance your browsing
        experience.
      </CookieConsent>
    </AppStateProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
