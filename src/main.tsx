import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App as AntApp } from 'antd'
import router from './router/index.tsx'
import ErrorBoundary from './components/common/ErrorBoundary'
import AuthProvider from './components/AuthProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AntApp>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AntApp>
    </ErrorBoundary>
  </StrictMode>
)
