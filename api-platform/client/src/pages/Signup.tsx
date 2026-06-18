import { useState, useMemo } from 'react'
import { useSignUp } from '@clerk/clerk-react'
import { isClerkAPIResponseError } from '@clerk/clerk-react/errors'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import { Input } from '../components/Input'

type Strength = { label: string; color: string; width: string }

function getPasswordStrength(password: string): Strength {
  const criteria = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  if (password.length === 0) {
    return { label: '', color: '', width: '0%' }
  }

  if (password.length < 8 || criteria <= 2) {
    return { label: 'Weak', color: 'text-error bg-error', width: '33%' }
  }
  if (criteria <= 3) {
    return { label: 'Fair', color: 'text-warning bg-warning', width: '66%' }
  }
  return { label: 'Strong', color: 'text-success bg-success', width: '100%' }
}

export default function Signup() {
  const { signUp, isLoaded, setActive } = useSignUp()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-ink-muted">Loading...</div>
      </div>
    )
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!signUp) return
    setError(null)
    setLoading(true)

    try {
      await signUp.create({
        emailAddress: email,
        password,
      })
      await signUp.prepareVerification({ strategy: 'email_code' })
      setStep('verify')
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.message || 'Sign up failed')
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!signUp) return
    setError(null)
    setLoading(true)

    try {
      const result = await signUp.attemptVerification({
        strategy: 'email_code',
        code,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate('/dashboard')
      } else {
        setError('Verification could not be completed. Please try again.')
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.message || 'Verification failed')
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
            <UserPlus size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">
            {step === 'register' ? 'Create account' : 'Verify email'}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {step === 'register'
              ? 'Get started with OpsMCP.'
              : `We sent a code to ${email}.`}
          </p>
        </div>

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
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
              autoComplete="new-password"
            />
            {strength.label && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Password strength</span>
                  <span className={strength.color.split(' ')[0]}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${strength.color.split(' ')[1]}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-ink-tertiary">
                  Use at least 8 characters with uppercase, lowercase, number, and symbol.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-md bg-error-soft border border-error/30 text-sm text-error">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Verification code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
            />

            {error && (
              <div className="p-3 rounded-md bg-error-soft border border-error/30 text-sm text-error">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify email'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
