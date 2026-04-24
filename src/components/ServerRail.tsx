import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { InputModal, ActionModal } from './Modal'

interface Server {
  id: string
  name: string
  icon_url: string | null
}

export default function ServerRail() {
  const [servers, setServers] = useState<Server[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

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

    const channel = supabase
      .channel('servers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, () => {
        fetchServers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleCreateServer = async (name: string) => {
    if (!user) return

    const { data, error } = await supabase
      .from('servers')
      .insert({
        name,
        owner_id: user.id,
        icon_url: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
      })
      .select()
      .single()

    if (!error && data) {
      await supabase.from('memberships').insert({
        user_id: user.id,
        server_id: data.id,
        role: 'admin'
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="w-[72px] flex flex-col items-center py-3 gap-2 relative" style={{ background: 'linear-gradient(180deg, rgba(11,14,17,0.95) 0%, rgba(11,14,17,1) 100%)' }}>
      <Link
        to="/"
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-velocity-bg font-bold text-lg transition-all duration-300 hover:rounded-xl hover:shadow-[0_0_25px_rgba(0,209,255,0.5)]"
        style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}
      >
        V
      </Link>

      <div className="w-8 h-[2px] rounded-full" style={{ background: 'linear-gradient(to right, transparent, rgba(0,209,255,0.3), transparent)' }} />

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {servers.map((server) => (
          <Link
            key={server.id}
            to={`/server/${server.id}`}
            className="w-12 h-12 rounded-2xl transition-all duration-300 hover:rounded-xl flex items-center justify-center overflow-hidden group relative"
            style={{ background: 'linear-gradient(135deg, rgba(0,209,255,0.1) 0%, rgba(0,153,204,0.1) 100%)', border: '1px solid rgba(0,209,255,0.1)' }}
          >
            {server.icon_url ? (
              <img src={server.icon_url} alt={server.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-velocity-text font-medium">{server.name[0]}</span>
            )}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all duration-200 opacity-0 group-hover:opacity-100" style={{ background: 'linear-gradient(180deg, #00D1FF 0%, #0099CC 100%)', boxShadow: '0 0 10px rgba(0,209,255,0.5)' }} />
          </Link>
        ))}

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 rounded-2xl transition-all duration-300 hover:rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-velocity-textMuted transition-all duration-200 hover:text-velocity-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <button
        onClick={() => setShowSettingsModal(true)}
        className="w-12 h-12 rounded-2xl transition-all duration-300 hover:rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-velocity-textMuted transition-all duration-200 hover:text-velocity-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <InputModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateServer}
        title="Create Server"
        placeholder="Enter server name"
        confirmText="Create"
      />

      <ActionModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Settings"
      >
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10"
          style={{ border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </ActionModal>
    </div>
  )
}
