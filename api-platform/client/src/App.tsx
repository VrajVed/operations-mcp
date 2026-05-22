import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-ink font-sans tracking-tight">{title}</h1>
        <div className="mt-4 h-px w-16 bg-accent/30 mx-auto" />
        <p className="mt-5 text-lg text-ink-muted font-sans">Coming soon</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/playground" element={<ComingSoon title="Playground" />} />
            <Route path="/dashboard" element={<ComingSoon title="Dashboard" />} />
            <Route path="/docs" element={<ComingSoon title="Documentation" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
