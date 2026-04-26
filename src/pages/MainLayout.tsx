import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Markdown parser for chat messages
function parseMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
    // Strikethrough
    .replace(/~~(.*?)~~/g, '<del class="line-through opacity-70">$1</del>')
    // Code
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-black/20 rounded text-sm font-mono">$1</code>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="p-3 bg-black/20 rounded-lg overflow-x-auto text-sm font-mono my-2"><code>$1</code></pre>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br />')
}

// Check if text is a GIF URL
function isGifUrl(text: string): boolean {
  const gifRegex = /https?:\/\/.*\.(gif|giphy\.com\/media|tenor\.com\/view)/i
  return gifRegex.test(text)
}

// Extract GIF URL from text
function extractGifUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const matches = text.match(urlRegex)
  if (matches) {
    for (const match of matches) {
      if (isGifUrl(match)) return match
    }
  }
  return null
}

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
  const { darkMode, setDarkMode, signOut } = useApp()
  const navigate = useNavigate()
  const tabs: { id: Tab; icon: string }[] = [
    { id: 'home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'status', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { id: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]
  const labels = { home: 'Home', chat: 'Chat', status: 'Status', calls: 'Calls', settings: 'Settings' }

  const handleTabChange = (tabId: Tab) => {
    onTabChange(tabId)
    navigate(`/app/${tabId}`)
  }

  return (
    <div className="w-20 h-full flex flex-col items-center py-4" style={{ background: darkMode ? '#1a1a1a' : '#f0f2f5', borderRight: `1px solid ${darkMode ? '#2d2d2d' : '#e1e4e8'}` }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6 transition-transform duration-300 hover:scale-110 hover:rotate-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 15px rgba(102,126,234,0.4)' }}>
        V
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)} className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-105 hover:bg-opacity-50" style={{ background: activeTab === tab.id ? (darkMode ? '#2d2d2d' : '#e8eaed') : 'transparent', color: activeTab === tab.id ? '#667eea' : (darkMode ? '#888888' : '#666666') }}>
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
  const [gitCommits, setGitCommits] = useState<GitCommit[]>([])
  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })

  const onlineUsers = profiles.filter(p => p.is_online)
  const recentDms = dms.slice(0, 5)

  // Fetch git commits on mount and every 30 seconds
  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/tasqlab/velocity/commits?per_page=10')
        if (res.ok) {
          const data = await res.json()
          setGitCommits(data)
        }
      } catch (e) {
        console.error('Failed to fetch commits:', e)
      }
    }
    fetchCommits()
    const interval = setInterval(fetchCommits, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const formatCommitDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffHours < 48) return 'Yesterday'
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const getCommitEmoji = (message: string) => {
    const lower = message.toLowerCase()
    if (lower.includes('fix')) return '🐛'
    if (lower.includes('add') || lower.includes('feature')) return '✨'
    if (lower.includes('improve') || lower.includes('update') || lower.includes('better')) return '⚡'
    if (lower.includes('ui') || lower.includes('design') || lower.includes('style')) return '🎨'
    if (lower.includes('chat') || lower.includes('message')) return '💬'
    if (lower.includes('router') || lower.includes('route')) return '🚀'
    if (lower.includes('markdown') || lower.includes('gif')) return '�'
    return '📦'
  }

  // Widget definitions - example.html.txt inspired palette
  const widgets = [
    { id: 'time', title: 'Time', icon: '🕐', value: timeStr, sub: dateStr, color: '#3b82f6' },
    { id: 'online', title: 'Online', icon: '🟢', value: onlineUsers.length, sub: 'users', color: '#22c55e' },
    { id: 'chats', title: 'Messages', icon: '💬', value: dms.length, sub: 'total', color: '#60a5fa' },
    { id: 'groups', title: 'Groups', icon: '👥', value: groups.length, sub: 'joined', color: '#06b6d4' },
    { id: 'status', title: 'Status', icon: '📸', value: statuses.length, sub: 'updates', color: '#f59e0b' },
    { id: 'friends', title: 'Friends', icon: '🤝', value: friends.length, sub: 'connected', color: '#a78bfa' },
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Velocity</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{dateStr} · {timeStr}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="flex flex-col gap-5">
          {widgets.map((w) => (
            <div
              key={w.id}
              className="relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.01] cursor-pointer group"
              style={{
                background: 'rgba(8, 15, 32, 0.6)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(59, 130, 246, 0.12)',
                minHeight: '140px',
                padding: '28px'
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(160deg, ${w.color}08 0%, transparent 55%)` }}
              />
              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{w.icon}</span>
                    <span className="text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full" style={{ background: `${w.color}18`, color: w.color, border: `1px solid ${w.color}30` }}>
                      {w.title}
                    </span>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ background: w.color, boxShadow: `0 0 8px ${w.color}` }} />
                </div>
                <div>
                  <p className="text-5xl font-bold tracking-tight" style={{ color: w.color }}>{w.value}</p>
                  <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>{w.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Online Users */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(8, 15, 32, 0.4)', border: '1px solid rgba(59, 130, 246, 0.08)' }}>
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2 tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online Now ({onlineUsers.length})
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {onlineUsers.length > 0 ? onlineUsers.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2 min-w-fit transition-transform hover:scale-105">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                  {p.avatar_url ? <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" /> : <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.username[0].toUpperCase()}</span>}
                </div>
                <span className="text-xs truncate max-w-16" style={{ color: 'var(--text-primary)' }}>{p.username}</span>
              </div>
            )) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No one online</p>
            )}
          </div>
        </div>

        {/* Git Commits */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(8, 15, 32, 0.4)', border: '1px solid rgba(59, 130, 246, 0.08)' }}>
          <h2 className="text-sm font-semibold mb-5 tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>What's New</h2>
          <div className="space-y-3">
            {gitCommits.slice(0, 5).map((commit) => (
              <a
                key={commit.sha}
                href={commit.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/5 group"
                style={{ background: 'rgba(12, 22, 48, 0.5)', border: '1px solid rgba(59, 130, 246, 0.06)' }}
              >
                <span className="text-xl flex-shrink-0">{getCommitEmoji(commit.commit.message)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-blue-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {commit.commit.message.split('\n')[0].slice(0, 40)}
                  </p>
                </div>
                <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{formatCommitDate(commit.commit.author.date)}</span>
              </a>
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
  const [showProfileInfo, setShowProfileInfo] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [groupMembers, setGroupMembers] = useState<Profile[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (type === 'dm') {
      supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => setProfile(data as Profile))
      supabase.from('direct_messages').select('*').or(`and(sender_id.eq.${user?.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user?.id})`).order('created_at').then(({ data }) => setMessages(data || []))
    } else {
      supabase.from('group_chats').select('*').eq('id', id).single().then(({ data }) => setGroup(data as GroupChat))
      supabase.from('group_messages').select('*').eq('group_id', id).order('created_at').then(({ data }) => setMessages(data || []))
      // Fetch group members
      supabase.from('group_members').select('user_id, profiles(*)').eq('group_id', id).then(({ data }) => {
        if (data) setGroupMembers(data.map(m => (m.profiles as unknown) as Profile).filter(Boolean))
      })
    }
  }, [type, id, user])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !user) return
    const content = input.trim()
    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    
    // Optimistically add message to UI immediately
    if (type === 'dm') {
      const optimisticMessage: DirectMessage = {
        id: tempId,
        sender_id: user.id,
        receiver_id: id,
        content,
        created_at: now
      }
      setMessages(prev => [...(prev as DirectMessage[]), optimisticMessage])
      setInput('')
      
      // Send to database
      const { data } = await supabase.from('direct_messages').insert({ sender_id: user.id, receiver_id: id, content }).select()
      if (data && data[0]) {
        // Replace temp message with real one from DB
        setMessages(prev => (prev as DirectMessage[]).map(m => m.id === tempId ? data[0] as DirectMessage : m))
      }
    } else {
      const optimisticMessage: GroupMessage = {
        id: tempId,
        sender_id: user.id,
        group_id: id,
        content,
        created_at: now
      }
      setMessages(prev => [...(prev as GroupMessage[]), optimisticMessage])
      setInput('')
      
      // Send to database
      const { data } = await supabase.from('group_messages').insert({ group_id: id, sender_id: user.id, content }).select()
      if (data && data[0]) {
        setMessages(prev => (prev as GroupMessage[]).map(m => m.id === tempId ? data[0] as GroupMessage : m))
      }
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

  // Message component with markdown and GIF support
  const MessageContent = ({ content }: { content: string }) => {
    const gifUrl = extractGifUrl(content)
    const textContent = content.replace(gifUrl || '', '').trim()
    
    return (
      <div className="space-y-2">
        {gifUrl && (
          <div className="rounded-xl overflow-hidden max-w-xs">
            <img src={gifUrl} alt="GIF" className="w-full h-auto" loading="lazy" />
          </div>
        )}
        {textContent && (
          <div 
            className="leading-relaxed text-base prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(textContent) }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="relative z-10 px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        <button 
          onClick={() => type === 'dm' ? setShowProfileInfo(true) : setShowGroupInfo(true)}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: type === 'group' ? 'linear-gradient(135deg, #2563eb, #06b6d4)' : 'rgba(12,22,48,0.6)', border: '1px solid rgba(59,130,246,0.12)' }}>
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="font-semibold text-sm" style={{ color: type === 'group' ? 'white' : 'var(--text-primary)' }}>{title?.[0]?.toUpperCase()}</span>}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: '#60a5fa' }}>
              {type === 'dm' ? (
                <>
                  {profile?.is_online && <span className="w-[5px] h-[5px] rounded-full bg-green-500 inline-block" style={{ boxShadow: '0 0 6px #22c55e' }} />}
                  {profile?.is_online ? 'Online' : 'Offline'}
                </>
              ) : (
                <>{groupMembers.length} members</>
              )}
            </p>
          </div>
        </button>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {type === 'dm' && (
            <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5" style={{ color: 'rgba(160,190,240,0.35)', fontSize: '15px' }} title="Voice call">
              📞
            </button>
          )}
          {type === 'dm' && (
            <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5" style={{ color: 'rgba(160,190,240,0.35)', fontSize: '15px' }} title="Video call">
              🎥
            </button>
          )}
          {type === 'group' && (
            <button onClick={() => setShowInvite(true)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5" style={{ color: 'rgba(160,190,240,0.35)', fontSize: '15px' }} title="Add member">
              👤+
            </button>
          )}
          <button 
            onClick={() => type === 'dm' ? setShowProfileInfo(true) : setShowGroupInfo(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
            style={{ color: 'rgba(160,190,240,0.35)', fontSize: '17px' }}
            title="Info"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1" style={{ background: 'var(--bg-primary)' }}>
        {/* Subtle chat background gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 20% 30%, rgba(37,99,235,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 70%, rgba(6,182,212,0.03) 0%, transparent 60%)' }} />
        
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === user?.id
          const sender = profiles.find(p => p.id === msg.sender_id)
          const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id)
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const isNewGroup = index === 0 || messages[index - 1].sender_id !== msg.sender_id
          
          return (
            <div key={msg.id} className={`relative z-10 flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 ${isNewGroup ? 'mt-3' : ''}`}>
              {!isMe && showAvatar ? (
                <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(12,22,48,0.6)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  {sender?.avatar_url ? <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{sender?.username?.[0]?.toUpperCase() || '?'}</span>}
                </div>
              ) : !isMe ? <div className="w-7 flex-shrink-0" /> : null}
              
              <div className={`max-w-[68%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && showAvatar && sender && <span className="text-[11px] font-semibold ml-1" style={{ color: 'rgba(191,219,254,0.7)' }}>{sender.username}</span>}
                <div 
                  className={`px-4 py-2.5 backdrop-blur-md transition-all duration-200 ${isMe ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`}
                  style={{ 
                    background: isMe ? 'rgba(37, 99, 235, 0.82)' : 'rgba(12, 22, 50, 0.6)',
                    border: isMe ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(59,130,246,0.08)',
                    color: isMe ? '#dbeafe' : 'var(--text-primary)',
                    boxShadow: isMe ? '0 2px 16px rgba(37,99,235,0.25)' : '0 2px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  {/* Glass shine on outgoing */}
                  {isMe && (
                    <div className="absolute inset-0 pointer-events-none rounded-2xl rounded-br-sm" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
                  )}
                  <div className="relative z-10">
                    <MessageContent content={msg.content} />
                  </div>
                </div>
                <span className="text-[9px] font-mono opacity-40 px-1" style={{ color: 'var(--text-muted)' }}>{time}</span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-end gap-2.5">
          <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }} title="Attach">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          
          <div className="flex-1 flex items-end gap-2 rounded-2xl px-4 py-3 transition-all" style={{ background: 'rgba(12, 22, 48, 0.7)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Message" 
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed"
              style={{ 
                color: 'var(--text-primary)', 
                minHeight: '22px', 
                maxHeight: '110px',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}
            />
            <button className="text-lg leading-none pb-0.5 transition-transform hover:scale-110" style={{ color: 'var(--text-muted)' }}>😄</button>
          </div>
          
          <button 
            onClick={sendMessage} 
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)', 
              color: 'white',
              boxShadow: '0 0 18px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
            }}
          >
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

      {/* Profile Info Modal */}
      {showProfileInfo && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'var(--bg-primary)' }}>
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.username[0].toUpperCase()}</span>}
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.username}</h3>
              <p className="text-sm mt-1" style={{ color: profile.is_online ? '#10b981' : 'var(--text-secondary)' }}>{profile.is_online ? 'Online' : 'Offline'}</p>
            </div>
            {profile.description && <p className="text-center mb-4" style={{ color: 'var(--text-secondary)' }}>{profile.description}</p>}
            {profile.phone && <p className="text-center text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Phone: {profile.phone}</p>}
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl font-medium text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Message</button>
              <button onClick={() => setShowProfileInfo(false)} className="flex-1 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Info Modal */}
      {showGroupInfo && group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'var(--bg-primary)' }}>
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                {group.avatar_url ? <img src={group.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-white">{group.name[0].toUpperCase()}</span>}
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{group.name}</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{groupMembers.length} members</p>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>MEMBERS</p>
              {groupMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                    {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.username[0].toUpperCase()}</span>}
                  </div>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{m.username}</span>
                  {m.is_online && <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowGroupInfo(false); setShowInvite(true); }} className="flex-1 py-3 rounded-xl font-medium text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Add Member</button>
              <button onClick={() => setShowGroupInfo(false)} className="flex-1 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Close</button>
            </div>
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
  const location = useLocation()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [dms, setDms] = useState<DirectMessage[]>([])
  const [statuses, setStatuses] = useState<StatusUpdate[]>([])
  const [selectedChat, setSelectedChat] = useState<{ type: 'dm' | 'group'; id: string } | null>(null)

  // Sync active tab with URL
  useEffect(() => {
    const path = location.pathname
    const tabFromPath = path.split('/')[2] as Tab
    if (['home', 'chat', 'status', 'calls', 'settings'].includes(tabFromPath)) {
      setActiveTab(tabFromPath)
    } else if (path === '/app' || path === '/app/') {
      setActiveTab('home')
    }
  }, [location.pathname])

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode) }, [darkMode])

  const refresh = async () => {
    if (!user) return
    const { data: profilesData } = await supabase.from('profiles').select('*')
    if (profilesData) setProfiles(profilesData.filter(p => p.id !== user.id))
    const { data: friendsData } = await supabase.from('friends').select('friend_id, profiles(*)').eq('user_id', user.id).eq('status', 'accepted')
    if (friendsData) setFriends(friendsData.map(f => (f.profiles as unknown) as Profile))
    const { data: dmData } = await supabase.from('direct_messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false })
    if (dmData) setDms(dmData)
    const { data: groupData } = await supabase.from('group_members').select('group_id, group_chats(*)').eq('user_id', user.id)
    if (groupData) setGroups(groupData.map(g => (g.group_chats as unknown) as GroupChat))
    const { data: statusData } = await supabase.from('status_updates').select('*').order('created_at', { ascending: false }).limit(50)
    if (statusData) setStatuses(statusData)
  }

  useEffect(() => { if (user) refresh() }, [user])

  // Update URL when tab changes (but not on initial load to avoid double navigation)
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (location.pathname !== `/app/${tab}`) {
      navigate(`/app/${tab}`)
    }
  }

  if (loading) return <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}><div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: '#667eea' }} /></div>
  if (!user) return <Navigate to="/login" />

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, activeTab, setActiveTab: handleTabChange, profiles, groups, friends, dms, statuses, user, signOut, refresh }}>
      <div className="h-screen w-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'chat' && (<><ChatList onSelectChat={(type, id) => setSelectedChat({ type, id })} />{selectedChat ? <ChatArea type={selectedChat.type} id={selectedChat.id} /> : <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}><div className="text-center p-8"><div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}><svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div><p className="font-medium" style={{ color: 'var(--text-primary)' }}>Select a chat</p><p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Choose from your existing conversations</p></div></div>}</>)}
        {activeTab === 'status' && <StatusPage />}
        {activeTab === 'calls' && <CallsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </div>
    </AppContext.Provider>
  )
}
