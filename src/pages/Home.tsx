import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Server {
  id: string
  name: string
  icon_url: string | null
}

export default function Home() {
  const [servers, setServers] = useState<Server[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchServers = async () => {
      const { data } = await supabase
        .from('servers')
        .select('*')
        .order('name')

      if (data) setServers(data)
    }

    fetchServers()
  }, [user])

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1920&q=80')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-velocity-bg via-velocity-bg/80 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,209,255,0.08),transparent_70%)]" />
      
      <div className="relative z-10 text-center max-w-2xl px-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)', boxShadow: '0 0 40px rgba(0,209,255,0.4)' }}>
          <span className="text-5xl font-bold text-velocity-bg">V</span>
        </div>
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-velocity-accent via-velocity-accentHover to-velocity-accent mb-4" style={{ textShadow: '0 0 40px rgba(0,209,255,0.3)' }}>
          Welcome to Velocity
        </h1>
        <p className="text-xl text-velocity-textMuted mb-12">
          Your gateway to seamless real-time communication
        </p>

        {servers.length === 0 ? (
          <div className="p-8 rounded-2xl" style={{ background: 'rgba(20,23,28,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-velocity-textMuted mb-4 text-lg">You haven't joined any servers yet.</p>
            <p className="text-velocity-textMuted">Create a new server from the sidebar to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {servers.map((server) => (
              <Link
                key={server.id}
                to={`/server/${server.id}`}
                className="group flex flex-col items-center p-6 rounded-2xl transition-all duration-300 hover:scale-105"
                style={{ background: 'rgba(20,23,28,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
              >
                <div className="w-20 h-20 rounded-2xl mb-4 flex items-center justify-center text-velocity-bg font-bold text-3xl overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(0,209,255,0.4)]" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}>
                  {server.icon_url ? (
                    <img src={server.icon_url} alt={server.name} className="w-full h-full object-cover" />
                  ) : (
                    server.name[0]
                  )}
                </div>
                <span className="text-velocity-text font-semibold text-lg">{server.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
