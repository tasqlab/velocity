import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, username)
        if (error) throw error
        setShowSuccess(true)
        setShowForm(false)
        setEmail('')
        setPassword('')
        setUsername('')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Success Message */}
      {showSuccess && (
        <div className="relative z-10 text-center px-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-8" style={{ background: 'var(--accent)', boxShadow: '0 20px 60px rgba(29,155,240,0.3)' }}>
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Check Your Email</h2>
          <p className="text-xl mb-8" style={{ color: '#888888' }}>
            We've sent a confirmation link to<br/>
            <span className="text-white font-medium">{email}</span>
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="px-8 py-3 rounded-full font-medium transition-all"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            Back to Home
          </button>
        </div>
      )}

      {!showForm && !showSuccess ? (
        <div className="relative z-10 text-center px-12 py-16">
          {/* Logo */}
          <div className="flex items-center justify-center mb-12">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl" style={{ background: 'var(--accent)', boxShadow: '0 8px 30px rgba(29,155,240,0.3)' }}>
              V
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Welcome to Velocity
          </h1>
          <p className="text-xl mb-12" style={{ color: 'var(--text-secondary)' }}>
            Chat. Status. Calls.<br/>
            <span className="text-base">All in one place</span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 mt-8 max-w-sm mx-auto">
            <button
              onClick={() => { setIsSignUp(false); setShowForm(true); }}
              className="w-full py-4 rounded-full font-semibold text-lg transition-all hover:brightness-90"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              Login
            </button>
            <button
              onClick={() => { setIsSignUp(true); setShowForm(true); }}
              className="w-full py-4 rounded-full font-semibold text-lg transition-all"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              Sign Up
            </button>
          </div>

          {/* Terms */}
          <p className="mt-12 text-sm" style={{ color: 'var(--text-muted)' }}>
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      ) : showSuccess ? null : (
        <div className="relative z-10 w-full max-w-md mx-6">
          {/* Back Button */}
          <button
            onClick={() => setShowForm(false)}
            className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity text-lg"
            style={{ color: 'var(--text-primary)' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="p-8 rounded-2xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    placeholder="Username"
                    required
                  />
                </div>
              )}

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  placeholder="Email"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  placeholder="Password"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-semibold rounded-full transition-all disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm hover:opacity-80 transition-opacity"
                style={{ color: 'var(--accent)' }}
              >
                {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
