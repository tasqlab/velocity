import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    if (!data.session) {
      setError('Login failed. No session returned.')
      return
    }

    navigate('/')
  }

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/` 
      }
    })
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#02030a] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-slate-900 to-blue-900/40" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-black/65 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-6 mx-4 animate-float-soft">
        <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
        <p className="text-xs text-slate-400 mb-4">
          Log in to continue.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-white/40"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-white/40"
              required
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" className="w-full mt-1 py-2 bg-white text-black rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50">
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <button
          onClick={loginWithGoogle}
          className="w-full mt-3 py-2 bg-white text-black rounded-lg font-medium hover:bg-slate-200 transition-colors"
        >
          Continue with Google
        </button>

        <div className="mt-3 text-[11px] text-slate-400 flex justify-between">
          <Link to="/forgot-password" className="hover:text-slate-200">
            Forgot password?
          </Link>
          <Link to="/signup" className="hover:text-slate-200">
            Create account
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes float-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-soft { animation: float-soft 6s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
