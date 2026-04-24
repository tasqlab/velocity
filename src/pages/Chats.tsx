import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { InputModal, ActionModal } from '../components/Modal'

interface Chat {
  id: string
  name: string
  avatar_url: string | null
  last_message: string | null
  last_message_time: string | null
  unread_count: number
}

export default function Chats() {
  const [chats, setChats] = useState<Chat[]>([])
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchChats()
    
    const channel = supabase
      .channel('chats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, () => {
        fetchChats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchChats = async () => {
    const { data } = await supabase
      .from('servers')
      .select('*')
      .order('name')
    
    if (data) {
      const chatsWithMeta = data.map(server => ({
        id: server.id,
        name: server.name,
        avatar_url: server.icon_url,
        last_message: 'Click to chat',
        last_message_time: null,
        unread_count: 0
      }))
      setChats(chatsWithMeta)
    }
  }

  const handleCreateChat = async (name: string) => {
    if (!user) return

    const { data } = await supabase
      .from('servers')
      .insert({
        name,
        owner_id: user.id,
        icon_url: `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=00a884`
      })
      .select()
      .single()

    if (data) {
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

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="h-20 px-8 flex items-center justify-between" style={{ background: '#1a1a1a' }}>
        <div className="flex items-center gap-5">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}
          >
            {user?.email?.[0].toUpperCase()}
          </button>
          <span className="font-semibold text-xl text-white">Velocity</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="p-3 rounded-full hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-4" style={{ background: '#1a1a1a' }}>
        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl" style={{ background: '#252525' }}>
          <svg className="w-6 h-6" style={{ color: '#888888' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}`}
              className="flex items-center gap-5 px-6 py-5 hover:bg-white/5 transition-colors"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#252525' }}>
                {chat.avatar_url ? (
                  <img src={chat.avatar_url} alt={chat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xl">
                    {chat.name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg text-white truncate">{chat.name}</span>
                  <span className="text-sm" style={{ color: '#888888' }}>{chat.last_message_time || ''}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-base truncate" style={{ color: '#888888' }}>{chat.last_message}</span>
                  {chat.unread_count > 0 && (
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm text-white" style={{ background: '#00D1FF' }}>
                      {chat.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <svg className="w-16 h-16 mb-4" style={{ color: '#3a3a3a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-white font-medium mb-1">No chats yet</p>
            <p className="text-sm" style={{ color: '#888888' }}>Start a new conversation</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowNewChatModal(true)}
        className="absolute bottom-24 right-8 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)', boxShadow: '0 8px 30px rgba(0,209,255,0.4)' }}
      >
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Bottom Tab Bar */}
      <div className="h-20 flex items-center justify-around" style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
        <Link to="/home" className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#888888' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm font-medium">Home</span>
        </Link>
        <button
          className="flex flex-col items-center gap-2 py-2 px-6"
          style={{ color: '#00D1FF' }}
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">Chats</span>
        </button>
        <Link to="/status" className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#888888' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Status</span>
        </Link>
        <Link to="/calls" className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#888888' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-sm font-medium">Calls</span>
        </Link>
      </div>

      <InputModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onConfirm={handleCreateChat}
        title="New Chat"
        placeholder="Enter chat name"
        confirmText="Create"
      />

      <ActionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Profile"
      >
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#252525' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}>
            {user?.email?.[0].toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{user?.email}</div>
            <div className="text-sm" style={{ color: '#34eb7b' }}>Online</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10"
          style={{ border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </ActionModal>
    </div>
  )
}
