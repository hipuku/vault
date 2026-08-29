import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import App from './App'
import './styles/global.css'

// We import FA's CSS explicitly above, so stop it auto-injecting (avoids the
// flash of oversized icons before its style tag lands).
config.autoAddCss = false

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
