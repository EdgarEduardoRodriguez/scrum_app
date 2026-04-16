import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*
      Authprovider envuelve toda la app.
      asi cualquier componenete puede saber si hay sesion
    */}
  <AuthProvider>
    <App />
  </AuthProvider>
  </StrictMode>,
)
