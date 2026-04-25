import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  const navigate = useNavigate()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          avatar_url: null
        },
        emailRedirectTo: `${window.location.origin}/#/login` 
      }
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setShowPopup(true)
  }

  const signUpWithMagicLink = async () => {
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/#/login` 
      }
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setShowPopup(true)
  }

  const signUpWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/` 
      }
    })
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#02030a] relative overflow-hidden">
      {/* animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-slate-900 to-blue-900/40" />
      <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full bg-purple-500/25 blur-3xl animate-slow-orbit" />
      <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-blue-500/25 blur-3xl animate-slow-orbit" />

      {/* signup card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-black/65 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-6 mx-4 animate-float-soft">
        <h2 className="text-lg font-semibold mb-1">Create an account</h2>
        <p className="text-xs text-slate-400 mb-4">
          Pick a name, drop an email, and you're in.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-white/40"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-white/40"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-white/40"
              required
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" className="w-full mt-1 py-2 bg-white text-black rounded-2xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50">
            {loading ? 'Creating…' : 'Sign Up'}
          </button>
        </form>

        {/* magic link */}
        <button
          onClick={signUpWithMagicLink}
          className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-medium transition-colors disabled:opacity-50"
          disabled={loading}
        >
          Send Magic Link
        </button>

        {/* google oauth */}
        <button
          onClick={signUpWithGoogle}
          className="w-full mt-3 py-2 bg-white text-black rounded-2xl font-medium hover:bg-slate-200 transition-colors"
        >
          Continue with Google
        </button>

        <div className="mt-3 text-[11px] text-slate-400 flex justify-between">
          <span>Already have an account?</span>
          <Link to="/login" className="hover:text-slate-200">
            Log in
          </Link>
        </div>
      </div>

      {/* POPUP */}
      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xl z-20">
          <div className="bg-black/80 border border-white/20 rounded-xl p-6 shadow-xl animate-float-soft text-center max-w-xs">
            <h3 className="text-lg font-semibold mb-2">Check your email</h3>
            <p className="text-sm text-slate-300 mb-4">
              We sent you a verification link.  
              Open your inbox to finish signing up.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 bg-white text-black rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slow-orbit {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        @keyframes float-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-slow-orbit { animation: slow-orbit 20s ease-in-out infinite; }
        .animate-float-soft { animation: float-soft 6s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
