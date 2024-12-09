import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { initializeIcons } from '@fluentui/react'

import Chat from './pages/chat/Chat'
import Layout from './pages/layout/Layout'
import NoPage from './pages/NoPage'
import UnauthorizedPage from './pages/401Error'
import { AppStateProvider } from './state/AppProvider'

import './index.css'

initializeIcons()

function getTokenFromQueryParams() {
  const params = new URLSearchParams(window.location.search)
  return params.get('token')
}

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = getTokenFromQueryParams()

    if (!token) {
      
      navigate('/401Error')
    }
  }, [navigate])

  return (
    <AppStateProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Chat />} />
          <Route path="401Error" element={<UnauthorizedPage />} />
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </AppStateProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
