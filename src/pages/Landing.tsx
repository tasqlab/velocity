import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-30" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', filter: 'blur(60px)', animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-25" style={{ background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative z-10 text-center px-6">
        {/* Logo */}
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-transform duration-500 hover:scale-110 hover:rotate-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 20px 60px rgba(102,126,234,0.4)' }}>
          <span className="text-white font-bold text-4xl">V</span>
        </div>

        <h1 className="text-6xl font-bold mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Velocity
        </h1>
        
        <p className="text-xl mb-12 text-gray-400 max-w-md mx-auto">
          Connect with friends in real-time. Chat, share status updates, and more.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', boxShadow: '0 10px 30px rgba(102,126,234,0.3)' }}
          >
            Get Started
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 border-2"
            style={{ borderColor: '#667eea', color: '#667eea' }}
          >
            Sign In
          </button>
        </div>

        <p className="mt-12 text-sm text-gray-500">
          By continuing, you agree to our Terms of Service
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}
