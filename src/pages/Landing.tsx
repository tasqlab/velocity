import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="h-screen w-screen relative overflow-hidden bg-[#05070b] text-white">
      {/* animated glass + blobs */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl" />
      <div className="absolute -top-40 -right-40 w-[420px] h-[420px] rounded-full bg-purple-500/25 blur-3xl animate-slow-orbit" />
      <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-blue-500/25 blur-3xl animate-slow-orbit" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="max-w-2xl animate-float-soft">
          <h1 className="text-4xl md:text-6xl font-semibold mb-4">
            Your space. Your people.
          </h1>
          <p className="max-w-xl mx-auto text-slate-200 text-sm md:text-base mb-8">
            Servers, channels, DMs, and friends — all in one place.  
            Drop in, talk trash, build something, disappear, come back.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/login">
            <button className="px-6 py-3 text-base bg-white text-black hover:bg-slate-200 shadow-[0_18px_60px_rgba(0,0,0,0.9)] rounded-2xl font-medium transition-all hover:scale-105">
              Log In
            </button>
          </Link>

          <Link to="/signup">
            <button className="px-6 py-3 text-base bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.9)] rounded-2xl font-medium transition-all hover:scale-105">
              Sign Up
            </button>
          </Link>
        </div>
      </div>

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
