import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Login } from './pages/Login'
import Dashboard from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Goals } from './pages/Goals'
import { Calculator } from './pages/Calculator'
import { Categories } from './pages/Categories'
import Analytics from './pages/Analytics'
import { FixedBills } from './pages/FixedBills'
import { Layout } from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Bypassed for testing as requested
  return <>{children}</>
}

import { UIProvider } from './contexts/UIContext'

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/transacoes" element={<ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>} />
            <Route path="/analise" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
            <Route path="/categorias" element={<ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>} />
            <Route path="/metas" element={<ProtectedRoute><Layout><Goals /></Layout></ProtectedRoute>} />
            <Route path="/calculadora" element={<ProtectedRoute><Layout><Calculator /></Layout></ProtectedRoute>} />
            <Route path="/contas-fixas" element={<ProtectedRoute><Layout><FixedBills /></Layout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </UIProvider>
    </AuthProvider>
  )
}

export default App;
