import '@carnegie/duplo/lib/duplo.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './fonts.css'
import './i18next.config'
import './main.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
