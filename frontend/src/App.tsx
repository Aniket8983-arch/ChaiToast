import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/layout/Sidebar'
import Overview    from './pages/Overview'
import AIClassifier from './pages/AIClassifier'
import SmartBins   from './pages/SmartBins'
import Scheduling  from './pages/Scheduling'
import Vehicles    from './pages/Vehicles'
import Pickups     from './pages/Pickups'
import Compliance  from './pages/Compliance'
import Analytics   from './pages/Analytics'
import Devices     from './pages/Devices'
import Settings    from './pages/Settings'
import Login       from './pages/Login'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected Route Wrapper Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="w-8 h-8 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Shell Layout Wrapper containing Sidebar and Main Content area
const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      <Sidebar />
      {/* Main content offset by sidebar width */}
      <div className="flex-1 ml-64 overflow-auto">
        <Routes>
          <Route path="/"            element={<Navigate to="/overview" replace />} />
          <Route path="/overview"    element={<Overview />} />
          <Route path="/waste"       element={<AIClassifier />} />
          <Route path="/bins"        element={<SmartBins />} />
          <Route path="/scheduling"  element={<Scheduling />} />
          <Route path="/vehicles"    element={<Vehicles />} />
          <Route path="/pickups"     element={<Pickups />} />
          <Route path="/compliance"  element={<Compliance />} />
          <Route path="/analytics"   element={<Analytics />} />
          <Route path="/devices"     element={<Devices />} />
          <Route path="/settings"    element={<Settings />} />
          <Route path="*"            element={<Navigate to="/overview" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
