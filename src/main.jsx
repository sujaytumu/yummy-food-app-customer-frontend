import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'
import './index.css'
import { getTheme, applyTheme } from './theme/theme'

applyTheme(getTheme())
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </React.StrictMode>,
)
