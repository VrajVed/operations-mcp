import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignUp, SignIn, RedirectToSignIn, useAuth } from '@clerk/clerk-react'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-ink-muted">Loading...</div>
      </div>
    )
  }
  
  if (!isSignedIn) {
    return <RedirectToSignIn />
  }
  
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/signup" element={<SignUp routing="path" path="/signup" />} />
            <Route path="/login" element={<SignIn routing="path" path="/login" />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/playground" 
              element={
                <ProtectedRoute>
                  <div className="flex items-center justify-center min-h-[70vh]">
                    <div className="text-center max-w-md mx-auto px-4">
                      <h1 className="text-4xl md:text-5xl font-bold text-ink font-sans tracking-tight">Playground</h1>
                      <div className="mt-4 h-px w-16 bg-accent/30 mx-auto" />
                      <p className="mt-5 text-lg text-ink-muted font-sans">Coming soon</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
