import { useState, useEffect, createContext, useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Profile { id: string; username: string; avatar_url: string | null; description: string | null; phone: string | null; is_online: boolean }
interface GroupChat { id: string; name: string; avatar_url: string | null }
interface DirectMessage { id: string; sender_id: string; receiver_id: string; content: string; created_at: string }
interface GroupMessage { id: string; group_id: string; sender_id: string; content: string; created_at: string }
interface StatusUpdate { id: string; user_id: string; content: string | null; media_url: string | null; media_type: string | null; created_at: string }

type Tab = 'home' | 'chat' | 'status' | 'calls' | 'settings'

interface AppContextType {
  darkMode: boolean; setDarkMode: (v: boolean) => void; activeTab: Tab; setActiveTab: (t: Tab) => void;
  profiles: Profile[]; groups: GroupChat[]; friends: Profile[]; dms: DirectMessage[]; statuses: StatusUpdate[]; user: any; signOut: () => void; refresh: () => void;
}

const AppContext = createContext<AppContextType | null>(null)
export const useApp = () => useContext(AppContext)!

function Sidebar({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  const { darkMode, setDarkMode, user, signOut } = useApp()
  const tabs: { id: Tab; icon: string }[] = [
    { id: 'home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'status', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { id: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]
  const labels = { home: 'Home', chat: 'Chat', status: 'Status', calls: 'Calls', settings: 'Settings' }

  return (
    <div className="w-20 h-full flex flex-col items-center py-4" style={{ background: darkMode ? '#1a1a1a' : '#f0f2f5', borderRight: `1px solid ${darkMode ? '#2d2d2d' : '#e1e4e8'}` }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6 transition-transform duration-300 hover:scale-110 hover:rotate-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102,126,234,0.4)' }}>
        V
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)} className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-105 hover:bg-opacity-50" style={{ background: activeTab === tab.id ? (darkMode ? '#2d2d2d' : '#e8eaed') : 'transparent', color: activeTab === tab.id ? '#667eea' : (darkMode ? '#888888' : '#666666') }}>
            <svg className="w-6 h-6 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
            <span className="text-[10px] font-medium">{labels[tab.id]}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={() => setDarkMode(!darkMode)} className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105" style={{ background: darkMode ? '#2d2d2d' : '#e8eaed', color: darkMode ? '#888888' : '#666666' }}>
          {darkMode ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
        </button>
        <button onClick={signOut} className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105" style={{ background: darkMode ? '#2d2d2d' : '#e8eaed', color: '#ef4444' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
    </div>
  )
}

function HomePage() {
  const { profiles, friends, dms, groups, user, statuses } = useApp()
  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })

  const onlineUsers = profiles.filter(p => p.is_online)
  const recentDms = dms.slice(0, 5)

  const updates = [
    { title: 'Welcome to Velocity!', desc: 'Version 1.0.0 is now live', date: 'New', icon: '🎉' },
    { title: 'Dark Mode', desc: 'Toggle between light and dark themes', date: 'New', icon: '🌙' },
    { title: 'Group Chats', desc: 'Create and manage group conversations', date: 'New', icon: '👥' },
    { title: 'Status Updates', desc: 'Share text, image, or video statuses', date: 'New', icon: '📸' },
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-8 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Velocity</h1>
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{timeStr}</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{dateStr}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
        {/* Online Users */}
        <div className="animate-fade-in">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online Now
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {onlineUsers.length > 0 ? onlineUsers.map((p, i) => (
              <div key={p.id} className="flex flex-col items-center gap-2 min-w-fit transition-transform duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-secondary)', boxShadow: '0 0 0 2px #667eea' }}>
                    {p.avatar_url ? <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" /> : <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{p.username[0].toUpperCase()}</span>}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 animate-pulse" style={{ borderColor: 'var(--bg-primary)' }} />
                </div>
                <span className="text-xs font-medium truncate max-w-16" style={{ color: 'var(--text-primary)' }}>{p.username}</span>
              </div>
            )) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No one online</p>
            )}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Recent Chats</h2>
          <div className="space-y-3">
            {recentDms.length > 0 ? recentDms.map((dm, i) => {
              const otherId = dm.sender_id === user?.id ? dm.receiver_id : dm.sender_id
              const profile = profiles.find(p => p.id === otherId)
              return (
                <div key={dm.id} className="flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{profile?.username?.[0]?.toUpperCase() || '?'}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{profile?.username || 'Unknown'}</p>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{dm.content}</p>
                  </div>
                </div>
              )
            }) : (
              <p className="text-sm p-4 rounded-xl text-center" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>No recent chats</p>
            )}
          </div>
        </div>

        {/* Updates */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>What's New</h2>
          <div className="space-y-3">
            {updates.map((u, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)' }}>
                <span className="text-2xl">{u.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#667eea', color: 'white' }}>{u.date}</span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatList({ onSelectChat }: { onSelectChat: (type: 'dm' | 'group', id: string) => void }) {
  const { groups, dms, profiles, user } = useApp()
  const [search, setSearch] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<Profile[]>([])

  // Deduplicate DMs - keep only the most recent message for each conversation
  const uniqueDms = dms.reduce((acc, dm) => {
    const otherId = dm.sender_id === user?.id ? dm.receiver_id : dm.sender_id
    if (!acc[otherId] || new Date(dm.created_at) > new Date(acc[otherId].created_at)) {
      acc[otherId] = dm
    }
    return acc
  }, {} as Record<string, DirectMessage>)

  const allChats = [
    ...groups.map(g => ({ type: 'group' as const, id: g.id, name: g.name, avatar: g.avatar_url, lastMsg: 'Group', time: '' })),
    ...Object.values(uniqueDms).map(dm => {
      const otherId = dm.sender_id === user?.id ? dm.receiver_id : dm.sender_id
      const profile = profiles.find(p => p.id === otherId)
      return { type: 'dm' as const, id: otherId, name: profile?.username || 'Unknown', avatar: profile?.avatar_url, lastMsg: dm.content, time: new Date(dm.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    })
  ]

  const filtered = allChats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (q.length > 0) {
      const { data } = await supabase.from('profiles').select('*').ilike('username', `%${q}%`)
      setSearchResults(data?.filter(p => p.id !== user?.id) || [])
      setShowSearch(true)
    } else {
      setShowSearch(false)
    }
  }

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

  const handleStartDM = (profileId: string) => {
    onSelectChat('dm', profileId)
    setShowSearch(false)
    setSearch('')
  }

  return (
    <div className="w-80 h-full flex flex-col" style={{ background: 'var(--bg-primary)', borderRight: '1px solid var(--border)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Chats</h1>
          <button onClick={() => setShowNewGroup(true)} className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search people..." value={search} onChange={(e) => handleSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text-primary)' }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showSearch && searchResults.length > 0 ? (
          <div className="p-2">
            <p className="text-xs font-medium px-3 py-2" style={{ color: 'var(--text-muted)' }}>SEARCH RESULTS</p>
            {searchResults.map(profile => (
              <div key={profile.id} onClick={() => handleStartDM(profile.id)} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-black/5">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                  {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" /> : <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.username[0].toUpperCase()}</span>}
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{profile.username}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{profile.is_online ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          filtered.map(chat => (
            <div key={`${chat.type}-${chat.id}`} onClick={() => onSelectChat(chat.type, chat.id)} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-black/5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{ background: chat.type === 'group' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-secondary)' }}>
                {chat.avatar ? <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" /> : <span className="font-semibold text-white">{chat.name[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{chat.name}</span>
                  {chat.time && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{chat.time}</span>}
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{chat.lastMsg}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--bg-primary)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>New Group</h3>
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name" className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <div className="flex gap-2">
              <button onClick={() => setShowNewGroup(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleCreateGroup} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Create</button>
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
  const [showInvite, setShowInvite] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])

  useEffect(() => {
    if (type === 'dm') {
      supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => setProfile(data as Profile))
      supabase.from('direct_messages').select('*').or(`and(sender_id.eq.${user?.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user?.id})`).order('created_at').then(({ data }) => setMessages(data || []))
    } else {
      supabase.from('group_chats').select('*').eq('id', id).single().then(({ data }) => setGroup(data as GroupChat))
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

  const handleInviteSearch = async (q: string) => {
    setInviteSearch(q)
    if (q.length > 0) {
      const { data } = await supabase.from('profiles').select('*').ilike('username', `%${q}%`)
      setSearchResults(data?.filter(p => p.id !== user?.id) || [])
    } else {
      setSearchResults([])
    }
  }

  const handleInvite = async (profileId: string) => {
    await supabase.from('group_members').insert({ group_id: id, user_id: profileId, role: 'member' })
    setInviteSearch('')
    setSearchResults([])
  }

  const title = type === 'dm' ? profile?.username : group?.name
  const avatar = type === 'dm' ? profile?.avatar_url : group?.avatar_url

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="h-16 px-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: type === 'group' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-secondary)' }}>
          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="font-semibold text-white">{title?.[0]?.toUpperCase()}</span>}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{type === 'dm' ? (profile?.is_online ? 'Online' : 'Offline') : 'Group'}</p>
        </div>
        {type === 'group' && (
          <button onClick={() => setShowInvite(true)} className="p-2 rounded-full hover:bg-black/5" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id
          const sender = profiles.find(p => p.id === msg.sender_id)
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                  {sender?.avatar_url ? <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{sender?.username?.[0]?.toUpperCase() || '?'}</span>}
                </div>
              )}
              <div className="max-w-[65%] flex flex-col gap-1">
                {!isMe && sender && <span className="text-xs font-medium px-1" style={{ color: 'var(--text-secondary)' }}>{sender.username}</span>}
                <div className="px-5 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.01]" style={{ background: isMe ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-secondary)', color: isMe ? 'white' : 'var(--text-primary)', boxShadow: isMe ? '0 4px 15px rgba(102,126,234,0.3)' : 'none' }}>
                  <p className="leading-relaxed text-base">{msg.content}</p>
                </div>
              </div>
              {isMe && <div className="w-8 h-8 flex-shrink-0" />}
            </div>
          )
        })}
      </div>

      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Message..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text-primary)' }} />
          <button onClick={sendMessage} className="p-2 rounded-full" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--bg-primary)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Invite to Group</h3>
            <input type="text" value={inviteSearch} onChange={(e) => handleInviteSearch(e.target.value)} placeholder="Search people..." className="w-full px-4 py-3 rounded-xl text-sm mb-3 outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <div className="max-h-48 overflow-y-auto space-y-2">
              {searchResults.map(p => (
                <div key={p.id} onClick={() => handleInvite(p.id)} className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-black/5">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.username[0]}</span>}
                  </div>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.username}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowInvite(false)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Close</button>
          </div>
        </div>
      )}
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
  const otherStatuses = user ? statuses.filter(s => s.user_id !== user.id) : []

  const handleAddStatus = async () => {
    if (!user || (!content.trim() && !mediaUrl.trim())) return
    await supabase.from('status_updates').insert({ user_id: user.id, content: content.trim(), media_url: mediaUrl.trim() || null, media_type: mediaUrl ? statusType : null })
    setShowAddModal(false)
    setContent('')
    setMediaUrl('')
  }

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}><h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Status</h1></div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-black/5" onClick={() => setShowAddModal(true)}>
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)', padding: '2px' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center font-semibold text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>You</div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
          </div>
          <div><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>My Status</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tap to add status</p></div>
        </div>
        {myStatuses.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>My updates</p>
            {myStatuses.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                {s.media_url ? <div className="w-14 h-14 rounded-xl overflow-hidden"><img src={s.media_url} alt="" className="w-full h-full object-cover" /></div> : <div className="w-14 h-14 rounded-xl flex items-center justify-center p-2" style={{ background: 'var(--bg-tertiary)' }}><p className="text-xs text-center" style={{ color: 'var(--text-primary)' }}>{s.content}</p></div>}
                <div><p className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.content || 'Media'}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleString()}</p></div>
              </div>
            ))}
          </div>
        )}
        {otherStatuses.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Recent updates</p>
            {otherStatuses.map(s => {
              const profile = profiles.find(p => p.id === s.user_id)
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-black/5">
                  <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)', padding: '2px' }}>
                    {s.media_url ? <div className="w-full h-full rounded-full overflow-hidden"><img src={s.media_url} alt="" className="w-full h-full object-cover" /></div> : <div className="w-full h-full rounded-full flex items-center justify-center font-semibold text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>{profile?.username?.[0] || '?'}</div>}
                  </div>
                  <div><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.username || 'Unknown'}</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(s.created_at).toLocaleString()}</p></div>
                </div>
              )
            })}
          </div>
        )}
        {otherStatuses.length === 0 && myStatuses.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
              <svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No status updates</p>
          </div>
        )}
      </div>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--bg-primary)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Add Status</h3>
            <div className="flex gap-2 mb-4">
              {(['text', 'image', 'video'] as const).map(t => (
                <button key={t} onClick={() => setStatusType(t)} className="flex-1 py-2 rounded-lg text-sm font-medium capitalize" style={{ background: statusType === t ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--bg-tertiary)', color: statusType === t ? 'white' : 'var(--text-secondary)' }}>{t}</button>
              ))}
            </div>
            {statusType === 'text' ? <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind?" className="w-full h-24 p-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} /> : <input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder={`Enter ${statusType} URL`} className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleAddStatus} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Post</button>
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
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}><h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Calls</h1></div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
          <svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
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
    if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => { if (data) { setUsername(data.username || ''); setDescription(data.description || ''); setPhone(data.phone || '') } })
  }, [user])

  const saveProfile = async () => { if (!user) return; await supabase.from('profiles').update({ username, description, phone }).eq('id', user.id) }

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}><h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>PROFILE</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>{user?.email?.[0].toUpperCase()}</div>
              <div><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.email?.split('@')[0]}</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p></div>
            </div>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bio" className="w-full p-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <button onClick={saveProfile} className="w-full py-3 rounded-xl font-medium text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Save Profile</button>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>APPEARANCE</h2>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Dark Mode</span>
            <button onClick={() => setDarkMode(!darkMode)} className="w-12 h-6 rounded-full transition-colors relative" style={{ background: darkMode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--border-strong)' }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: darkMode ? '28px' : '4px' }} />
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>ABOUT</h2>
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <p className="font-semibold" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Velocity</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MainLayout() {
  const { user, loading, signOut } = useAuth()
  const [darkMode, setDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [dms, setDms] = useState<DirectMessage[]>([])
  const [statuses, setStatuses] = useState<StatusUpdate[]>([])
  const [selectedChat, setSelectedChat] = useState<{ type: 'dm' | 'group'; id: string } | null>(null)

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode) }, [darkMode])

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

  useEffect(() => { if (user) refresh() }, [user])

  if (loading) return <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}><div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: '#667eea' }} /></div>
  if (!user) return <Navigate to="/login" />

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, activeTab, setActiveTab, profiles, groups, friends, dms, statuses, user, signOut, refresh }}>
      <div className="h-screen w-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'chat' && (<><ChatList onSelectChat={(type, id) => setSelectedChat({ type, id })} />{selectedChat ? <ChatArea type={selectedChat.type} id={selectedChat.id} /> : <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}><div className="text-center"><div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}><svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div><p className="font-medium" style={{ color: 'var(--text-primary)' }}>Select a chat</p><p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Choose from your existing conversations</p></div></div>}</>)}
        {activeTab === 'status' && <StatusPage />}
        {activeTab === 'calls' && <CallsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </div>
    </AppContext.Provider>
  )
}
