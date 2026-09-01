import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App as AntApp } from 'antd'
import router from './router/index.tsx'
import ErrorBoundary from './components/common/ErrorBoundary'
import GlobalLoadingOverlay from './components/common/GlobalLoadingOverlay'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AntApp>
        <GlobalLoadingOverlay />
        <RouterProvider router={router} />
      </AntApp>
    </ErrorBoundary>
  </StrictMode>
)
