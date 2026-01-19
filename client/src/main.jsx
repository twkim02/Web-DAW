import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Community from './pages/Community.jsx'
import { ToastProvider } from './components/UI/ToastContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workspace" element={<App />} />
          <Route path="/community/*" element={<Community />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
)
