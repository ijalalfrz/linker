import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app.tsx'

// @ts-expect-error - ZAFClient is provided by Zendesk at runtime
const client = ZAFClient.init()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App client={client} />
  </StrictMode>
)
