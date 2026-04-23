import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProjectProvider } from './context/ProjectContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { UserProvider } from './context/UserContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
        <ProjectProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </ProjectProvider>
      </UserProvider>
    </AuthProvider>
  </StrictMode>,
)