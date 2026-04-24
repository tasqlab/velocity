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
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* Abstract Background Images */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80')] bg-cover bg-center" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/80 to-[#0a0a0a]" />
      
      {/* Background Effects - Blue */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,209,255,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,209,255,0.1),transparent_40%)]" />
      
      {/* Floating shapes - Blue */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #00D1FF 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #00D1FF 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Success Message */}
      {showSuccess && (
        <div className="relative z-10 text-center px-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-8" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)', boxShadow: '0 20px 60px rgba(0,209,255,0.4)' }}>
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
            className="px-8 py-3 rounded-2xl font-medium transition-all hover:scale-105"
            style={{ background: '#252525', border: '1px solid #3a3a3a', color: '#e9e9e9' }}
          >
            Back to Home
          </button>
        </div>
      )}

      {!showForm && !showSuccess ? (
        <div className="relative z-10 text-center px-12 py-16">
          {/* Logo */}
          <div className="flex items-center justify-center mb-16 mt-8">
            <div className="w-32 h-32 rounded-[40px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)', boxShadow: '0 25px 80px rgba(0,209,255,0.5)' }}>
              <svg viewBox="0 0 24 24" className="w-20 h-20 text-white" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="text-7xl font-bold text-white mb-8" style={{ textShadow: '0 8px 40px rgba(0,209,255,0.4)' }}>
            Velocity
          </h1>
          <p className="text-2xl mb-16 leading-relaxed" style={{ color: '#888888' }}>
            Chat. Status. Calls.<br/>
            <span className="text-lg" style={{ color: '#666666' }}>All in one place</span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-6 mt-8">
            <button
              onClick={() => { setIsSignUp(false); setShowForm(true); }}
              className="px-12 py-5 rounded-[28px] font-semibold text-xl transition-all hover:scale-105 hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)', boxShadow: '0 15px 50px rgba(0,209,255,0.4)' }}
            >
              Login
            </button>
            <button
              onClick={() => { setIsSignUp(true); setShowForm(true); }}
              className="px-12 py-5 rounded-[28px] font-semibold text-xl transition-all hover:scale-105"
              style={{ background: '#252525', border: '1px solid #3a3a3a', color: '#e9e9e9' }}
            >
              Sign Up
            </button>
          </div>

          {/* Terms */}
          <p className="mt-16 text-base" style={{ color: '#666666' }}>
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      ) : showSuccess ? null : (
        <div className="relative z-10 w-full max-w-lg mx-6">
          {/* Back Button */}
          <button
            onClick={() => setShowForm(false)}
            className="flex items-center gap-3 text-white mb-8 hover:opacity-80 transition-opacity text-lg"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="p-10 rounded-3xl" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <h2 className="text-3xl font-bold text-white mb-8">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl text-white placeholder-white/40 bg-transparent border border-white/10 focus:outline-none focus:border-[#00D1FF] text-lg"
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
                  className="w-full px-6 py-4 rounded-2xl text-white placeholder-white/40 bg-transparent border border-white/10 focus:outline-none focus:border-[#00D1FF] text-lg"
                  placeholder="Email"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl text-white placeholder-white/40 bg-transparent border border-white/10 focus:outline-none focus:border-[#00D1FF] text-lg"
                  placeholder="Password"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-4 rounded-lg text-red-400 text-base" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 font-semibold rounded-2xl transition-all disabled:opacity-50 text-lg"
                style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Login'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-base hover:opacity-80 transition-opacity"
                style={{ color: '#00D1FF' }}
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
