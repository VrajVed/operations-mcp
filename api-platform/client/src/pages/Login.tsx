import { useState } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import { isClerkAPIResponseError } from '@clerk/clerk-react/errors'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import { Input } from '../components/Input'

export default function Login() {
  const { signIn, isLoaded, setActive } = useSignIn()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-ink-muted">Loading...</div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signIn) return
    setError(null)
    setLoading(true)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/dashboard')
      } else if (result.status === 'needs_second_factor') {
        setError('Two-factor authentication is required.')
      } else {
        setError('Sign in could not be completed. Please try again.')
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.message || 'Sign in failed')
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-accent-soft text-accent mb-4">
            <LogIn size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Sign in</h1>
          <p className="text-sm text-ink-muted mt-1">
            Welcome back. Sign in to manage your API keys.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="p-3 rounded-md bg-error-soft border border-error/30 text-sm text-error">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-accent hover:text-accent-hover font-medium">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  )
}
