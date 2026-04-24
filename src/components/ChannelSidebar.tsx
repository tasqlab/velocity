import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { InputModal, Accordion, ActionModal } from './Modal'

interface Channel {
  id: string
  server_id: string
  name: string
  type: 'text' | 'voice'
}

interface Profile {
  id: string
  username: string
  avatar_url: string
  status: string
}

export default function ChannelSidebar() {
  const { serverId } = useParams()
  const [channels, setChannels] = useState<Channel[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!serverId || !user) return

    const fetchChannels = async () => {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('name')

      if (data) setChannels(data)
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data)
    }

    fetchChannels()
    fetchProfile()

    const channel = supabase
      .channel('channels-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => {
        fetchChannels()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [serverId, user])

  const handleCreateChannel = async (name: string) => {
    if (!serverId) return

    await supabase.from('channels').insert({
      server_id: serverId,
      name,
      type: 'text'
    })
  }

  const textChannels = channels.filter(c => c.type === 'text')
  const voiceChannels = channels.filter(c => c.type === 'voice')

  return (
    <div className="w-60 flex flex-col" style={{ background: 'linear-gradient(180deg, rgba(20,23,28,0.95) 0%, rgba(20,23,28,1) 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="h-14 px-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <h2 className="font-semibold text-velocity-text truncate">Server</h2>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-velocity-textMuted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <Accordion title="Text Channels" defaultOpen={true}>
          {textChannels.length > 0 ? (
            <div className="space-y-1">
              {textChannels.map((channel) => (
                <Link
                  key={channel.id}
                  to={`/server/${serverId}/${channel.id}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-velocity-surfaceHover text-velocity-textMuted hover:text-velocity-text group"
                >
                  <span className="text-lg text-velocity-textMuted group-hover:text-velocity-accent transition-colors">#</span>
                  <span className="truncate font-medium">{channel.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-velocity-textMuted px-3 py-2">No channels yet</p>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 mt-2 rounded-lg text-velocity-textMuted hover:text-velocity-accent transition-colors w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">Add Channel</span>
          </button>
        </Accordion>

        <Accordion title="Voice Channels" defaultOpen={false}>
          {voiceChannels.length > 0 ? (
            <div className="space-y-1">
              {voiceChannels.map((channel) => (
                <Link
                  key={channel.id}
                  to="#"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-velocity-surfaceHover text-velocity-textMuted hover:text-velocity-text group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-velocity-textMuted group-hover:text-velocity-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <span className="truncate font-medium">{channel.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-velocity-textMuted px-3 py-2">No voice channels</p>
          )}
        </Accordion>
      </div>

      <div
        onClick={() => setShowProfileModal(true)}
        className="h-16 px-3 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:bg-velocity-surface"
        style={{ background: 'rgba(17,18,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-velocity-bg font-semibold transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,209,255,0.4)]" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-xl" />
            ) : (
              user?.email?.[0].toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ borderColor: 'rgba(17,18,20,0.95)', background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-velocity-text truncate">{profile?.username || user?.email}</div>
          <div className="text-xs text-green-400">Online</div>
        </div>
      </div>

      <InputModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateChannel}
        title="Create Channel"
        placeholder="Enter channel name"
        confirmText="Create"
      />

      <ActionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Profile"
      >
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-velocity-bg font-bold text-2xl" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-2xl" />
            ) : (
              user?.email?.[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="text-lg font-semibold text-velocity-text">{profile?.username || user?.email}</div>
            <div className="text-sm text-green-400">Online</div>
          </div>
        </div>
        <button
          onClick={() => {
            setShowProfileModal(false)
            navigate('/')
          }}
          className="w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-velocity-text hover:bg-velocity-surface"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          View Profile
        </button>
      </ActionModal>
    </div>
  )
}
