import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
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
import GoogleAnalytics from './ga'

initializeIcons()

export default function App() {
  
  const GA_TRACKING_ID = 'G-L0S6VRT5BT'; // Replace with your Google Analytics tracking ID

  return (
    
    <AppStateProvider>
      <GoogleAnalytics trackingId={GA_TRACKING_ID} />
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
