import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { initializeIcons } from '@fluentui/react'

import Chat from './pages/chat/Chat'
import Layout from './pages/layout/Layout'
import NoPage from './pages/NoPage'
import { AppStateProvider } from './state/AppProvider'

import './index.css'
import InputLevel2 from './components/Home/InputLevel2'
import Recommendations from './components/Recommendations/Recommendations'
import ProductInformation from './components/ProductInformation/ProductInformation'
import Feedback from './components/Feedback/Feedback'
import PreventBackNavigation from './components/common/PreventBackNavigation'
import ReactGA from 'react-ga4';

initializeIcons()

export default function App() {
  
  const GA_TRACKING_ID = 'G-L0S6VRT5BT'; // Replace with your Google Analytics tracking ID
  
  useEffect(() => {
    ReactGA.initialize(GA_TRACKING_ID);
    // Send pageview with a custom path
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, [])


  

  // Send pageview with a custom path
  

  //const ga4react = new GA4React('G-XXXXXXXXXX');
  // // Initialize Google Analytics 4 with your measurement ID
  // const ga4react = new GA4React('G-L0S6VRT5BT');

  // ga4react.initialize();
  // const location = useLocation();
  
  // useEffect(() => {
  //   ReactGA.send('pageview', { page_path: location.pathname,page_title: document.title,}); 
  // }, [location]);

  return (
    
    <AppStateProvider>
      <HashRouter>
      <PreventBackNavigation />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Chat />} />
            <Route path='inputLevel2' element={<InputLevel2 />} />
            <Route path='recommendations' element={<Recommendations />} />
            <Route path='productInfo' element={<ProductInformation />} />
            <Route path='feedback' element={<Feedback />} />


            <Route path="*" element={<NoPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppStateProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
)
