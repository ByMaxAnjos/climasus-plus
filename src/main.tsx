import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/aurora.css'
import './styles/studio.css'
import './store/pipeline' // registers dev-only window.__store

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
