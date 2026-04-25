import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Landing() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0a0a0f] text-white">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-[#0a0a0f] to-blue-950/30" />
      
      {/* Interactive spotlight effect */}
      <div 
        className="absolute pointer-events-none transition-opacity duration-300"
        style={{
          left: mousePos.x - 200,
          top: mousePos.y - 200,
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-violet-600/20 blur-3xl animate-float-1" />
      <div className="absolute top-40 right-[15%] w-96 h-96 rounded-full bg-blue-600/15 blur-3xl animate-float-2" />
      <div className="absolute bottom-20 left-[20%] w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl animate-float-3" />
      <div className="absolute bottom-40 right-[10%] w-72 h-72 rounded-full bg-purple-600/15 blur-3xl animate-float-4" />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo */}
        <div className="mb-8 animate-fade-in-down">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-violet-500/25">
            <span className="text-4xl font-bold">V</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-3xl mx-auto mb-6 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-white via-violet-200 to-blue-200 bg-clip-text text-transparent">
              Your space.
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Your people.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
            Servers, channels, DMs, and friends — all in one place.  
            Connect, collaborate, and create together.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-in-up animation-delay-200">
          {['Chat', 'Voice', 'Communities', 'Status'].map((feature) => (
            <div 
              key={feature}
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 backdrop-blur-sm"
            >
              {feature}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-300">
          <Link to="/signup">
            <button className="group relative px-8 py-4 bg-white text-black rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20 overflow-hidden">
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-100 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </Link>
          <Link to="/login">
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              Sign In
            </button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 flex items-center gap-6 text-slate-500 text-sm animate-fade-in animation-delay-500">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Free forever
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            End-to-end encrypted
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            Join others
          </span>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />

      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 20px) scale(0.95); }
          66% { transform: translate(20px, -40px) scale(1.05); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, 40px) scale(1.05); }
          66% { transform: translate(-30px, -20px) scale(0.95); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, -40px) scale(0.9); }
          66% { transform: translate(40px, 10px) scale(1.1); }
        }
        .animate-float-1 { animation: float-1 20s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 25s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 22s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 28s ease-in-out infinite; }
        
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-500 { animation-delay: 0.5s; }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
