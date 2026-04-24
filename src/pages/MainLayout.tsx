import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Profile {
  id: string
  username: string
  avatar_url: string | null
  description: string | null
  phone: string | null
  is_online: boolean
}

interface GroupChat {
  id: string
  name: string
  avatar_url: string | null
}

interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  content: string
  created_at: string
}

interface StatusUpdate {
  id: string
  user_id: string
  content: string | null
  media_url: string | null
  media_type: string | null
  created_at: string
}

type Tab = 'chats' | 'status' | 'calls' | 'settings'

interface AppContextType {
  darkMode: boolean
  setDarkMode: (v: boolean) => void
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  profiles: Profile[]
  groups: GroupChat[]
  friends: Profile[]
  dms: DirectMessage[]
  statuses: StatusUpdate[]
  user: any
  signOut: () => void
  refresh: () => void
}

const AppContext = createContext<AppContextType | null>(null)
export const useApp = () => useContext(AppContext)!

function Sidebar({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  const { darkMode, setDarkMode, user, signOut } = useApp()
  
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'chats', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Chats' },
    { id: 'status', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Status' },
    { id: 'calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Calls' },
    { id: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Settings' },
  ]

  return (
    <div className="w-20 h-full flex flex-col items-center py-4" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-6" style={{ background: 'var(--accent)', boxShadow: '0 4px 12px rgba(29,155,240,0.3)' }}>
        V
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-2 flex-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
            style={{ 
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)'
            }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
          </button>
        ))}
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <button
          onClick={signOut}
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'var(--bg-tertiary)', color: '#f87171' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ChatsList({ onSelectChat }: { onSelectChat: (type: 'dm' | 'group', id: string) => void }) {
  const { groups, friends, dms, profiles, user } = useApp()
  const [search, setSearch] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const allChats = [
    ...groups.map(g => ({ type: 'group' as const, id: g.id, name: g.name, avatar: g.avatar_url, lastMsg: 'Group chat', time: '' })),
    ...dms.map(dm => {
      const otherId = dm.sender_id === user?.id ? dm.receiver_id : dm.sender_id
      const profile = profiles.find(p => p.id === otherId)
      return { type: 'dm' as const, id: otherId, name: profile?.username || 'Unknown', avatar: profile?.avatar_url, lastMsg: dm.content, time: new Date(dm.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    })
  ]

  const filtered = allChats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return
    const { data: group } = await supabase.from('group_chats').insert({ name: newGroupName, created_by: user.id }).select().single()
    if (group) {
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'admin' })
      onSelectChat('group', group.id)
    }
    setShowNewGroup(false)
    setNewGroupName('')
  }

  return (
    <div className="w-80 h-full flex flex-col" style={{ background: 'var(--bg-primary)', borderRight: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Chats</h1>
          <button
            onClick={() => setShowNewGroup(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(chat => (
          <div
            key={`${chat.type}-${chat.id}`}
            onClick={() => onSelectChat(chat.type, chat.id)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:brightness-95"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: chat.type === 'group' ? 'var(--accent)' : 'var(--bg-tertiary)' }}>
              {chat.avatar ? (
                <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold" style={{ color: chat.type === 'group' ? 'white' : 'var(--text-primary)' }}>
                  {chat.name[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{chat.name}</span>
                {chat.time && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{chat.time}</span>}
              </div>
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{chat.lastMsg}</p>
            </div>
          </div>
        ))}
      </div>

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--bg-primary)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>New Group</h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNewGroup(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleCreateGroup} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChatArea({ type, id }: { type: 'dm' | 'group'; id: string }) {
  const { profiles, groups, user } = useApp()
  const [messages, setMessages] = useState<DirectMessage[] | GroupMessage[]>([])
  const [input, setInput] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [group, setGroup] = useState<GroupChat | null>(null)

  useEffect(() => {
    if (type === 'dm') {
      supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => setProfile(data))
      supabase.from('direct_messages').select('*').or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`).order('created_at').then(({ data }) => setMessages(data || []))
    } else {
      supabase.from('group_chats').select('*').eq('id', id).single().then(({ data }) => setGroup(data))
      supabase.from('group_messages').select('*').eq('group_id', id).order('created_at').then(({ data }) => setMessages(data || []))
    }
  }, [type, id, user])

  const sendMessage = async () => {
    if (!input.trim() || !user) return
    if (type === 'dm') {
      await supabase.from('direct_messages').insert({ sender_id: user.id, receiver_id: id, content: input })
      setInput('')
    } else {
      await supabase.from('group_messages').insert({ group_id: id, sender_id: user.id, content: input })
      setInput('')
    }
  }

  const title = type === 'dm' ? profile?.username : group?.name
  const avatar = type === 'dm' ? profile?.avatar_url : group?.avatar_url

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Top Bar */}
      <div className="h-16 px-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-black/5">
          <svg className="w-5 h-5" style={{ color: 'var(--text-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: type === 'group' ? 'var(--accent)' : 'var(--bg-tertiary)' }}>
          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="font-semibold" style={{ color: type === 'group' ? 'white' : 'var(--text-primary)' }}>{title?.[0]?.toUpperCase()}</span>}
        </div>
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{type === 'dm' ? (profile?.is_online ? 'Online' : 'Offline') : 'Group'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMe ? '' : ''}`} style={{ background: isMe ? 'var(--accent)' : 'var(--bg-secondary)', color: isMe ? 'white' : 'var(--text-primary)' }}>
                {msg.content}
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Message..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
          <button onClick={sendMessage} className="p-2 rounded-full" style={{ background: 'var(--accent)', color: 'white' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusPage() {
  const { statuses, profiles, user } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusType, setStatusType] = useState<'text' | 'image' | 'video'>('text')
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')

  const myStatuses = user ? statuses.filter(s => s.user_id === user.id) : []
  const otherStatuses = user ? statuses.filter(s => s.user_id !== user.id) : statuses

  const handleAddStatus = async () => {
    if (!user || (!content.trim() && !mediaUrl.trim())) return
    await supabase.from('status_updates').insert({
      user_id: user.id,
      content: content.trim(),
      media_url: mediaUrl.trim() || null,
      media_type: mediaUrl ? statusType : null
    })
    setShowAddModal(false)
    setContent('')
    setMediaUrl('')
  }

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Status</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* My Status */}
        <div className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-black/5" onClick={() => setShowAddModal(true)}>
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)', padding: '2px' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center font-semibold" style={{ background: 'var(--accent)', color: 'white' }}>You</div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)', color: 'white' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>My Status</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tap to add status</p>
          </div>
        </div>

        {/* My Status List */}
        {myStatuses.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>My updates</p>
            {myStatuses.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                {s.media_url ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden"><img src={s.media_url} alt="" className="w-full h-full object-cover" /></div>
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center p-2" style={{ background: 'var(--bg-tertiary)' }}><p className="text-xs text-center" style={{ color: 'var(--text-primary)' }}>{s.content}</p></div>
                )}
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.content || 'Media'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Others */}
        {otherStatuses.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Recent updates</p>
            {otherStatuses.map(s => {
              const profile = profiles.find(p => p.id === s.user_id)
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-black/5">
                  <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)', padding: '2px' }}>
                    {s.media_url ? (
                      <div className="w-full h-full rounded-full overflow-hidden"><img src={s.media_url} alt="" className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center font-semibold" style={{ background: 'var(--accent)', color: 'white' }}>{profile?.username?.[0] || '?'}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.username || 'Unknown'}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {otherStatuses.length === 0 && myStatuses.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
              <svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No status updates</p>
          </div>
        )}
      </div>

      {/* Add Status Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--bg-primary)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Add Status</h3>
            <div className="flex gap-2 mb-4">
              {(['text', 'image', 'video'] as const).map(t => (
                <button key={t} onClick={() => setStatusType(t)} className="flex-1 py-2 rounded-lg text-sm font-medium capitalize" style={{ background: statusType === t ? 'var(--accent)' : 'var(--bg-tertiary)', color: statusType === t ? 'white' : 'var(--text-secondary)' }}>{t}</button>
              ))}
            </div>
            {statusType === 'text' ? (
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind?" className="w-full h-24 p-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            ) : (
              <input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder={`Enter ${statusType} URL`} className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleAddStatus} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CallsPage() {
  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Calls</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
          <svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No calls yet</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Start a call from a chat</p>
      </div>
    </div>
  )
}

function SettingsPage() {
  const { darkMode, setDarkMode, user } = useApp()
  const [username, setUsername] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setUsername(data.username || '')
          setDescription(data.description || '')
          setPhone(data.phone || '')
        }
      })
    }
  }, [user])

  const saveProfile = async () => {
    if (!user) return
    await supabase.from('profiles').update({ username, description, phone }).eq('id', user.id)
  }

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>PROFILE</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'var(--accent)' }}>
                {user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.email?.split('@')[0]}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
              </div>
            </div>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bio" className="w-full p-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <button onClick={saveProfile} className="w-full py-3 rounded-xl font-medium text-white" style={{ background: 'var(--accent)' }}>Save Profile</button>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>APPEARANCE</h2>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Dark Mode</span>
            <button onClick={() => setDarkMode(!darkMode)} className="w-12 h-6 rounded-full transition-colors relative" style={{ background: darkMode ? 'var(--accent)' : 'var(--border-strong)' }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: darkMode ? '28px' : '4px' }} />
            </button>
          </div>
        </div>

        {/* About */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>ABOUT</h2>
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <p className="font-semibold" style={{ color: 'var(--accent)' }}>Velocity</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MainLayout() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('chats')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [dms, setDms] = useState<DirectMessage[]>([])
  const [statuses, setStatuses] = useState<StatusUpdate[]>([])
  const [selectedChat, setSelectedChat] = useState<{ type: 'dm' | 'group'; id: string } | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const refresh = async () => {
    if (!user) return
    const { data: profilesData } = await supabase.from('profiles').select('*')
    if (profilesData) setProfiles(profilesData.filter(p => p.id !== user.id))
    const { data: friendsData } = await supabase.from('friends').select('friend_id, profiles(*)').eq('user_id', user.id).eq('status', 'accepted')
    if (friendsData) setFriends(friendsData.map(f => f.profiles as Profile))
    const { data: dmData } = await supabase.from('direct_messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false })
    if (dmData) setDms(dmData)
    const { data: groupData } = await supabase.from('group_members').select('group_id, group_chats(*)').eq('user_id', user.id)
    if (groupData) setGroups(groupData.map(g => g.group_chats as GroupChat))
    const { data: statusData } = await supabase.from('status_updates').select('*').order('created_at', { ascending: false }).limit(50)
    if (statusData) setStatuses(statusData)
  }

  useEffect(() => {
    if (user) refresh()
  }, [user])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, activeTab, setActiveTab, profiles, groups, friends, dms, statuses, user, signOut, refresh }}>
      <div className="h-screen w-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === 'chats' && (
          <>
            <ChatsList onSelectChat={(type, id) => setSelectedChat({ type, id })} />
            {selectedChat && <ChatArea type={selectedChat.type} id={selectedChat.id} />}
            {!selectedChat && (
              <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                    <svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Select a chat</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Choose from your existing conversations or start a new one</p>
                </div>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'status' && <StatusPage />}
        {activeTab === 'calls' && <CallsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </div>
    </AppContext.Provider>
  )
}
