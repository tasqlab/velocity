import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { deriveSharedKey, deriveGroupKey, encryptMessage, decryptMessage, formatEncryptedPayload, parseEncryptedPayload } from '../lib/crypto'

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
interface DirectMessage { id: string; sender_id: string; receiver_id: string; content: string; created_at: string; reply_to_id?: string; audio_url?: string; is_pinned?: boolean; pinned_at?: string; scheduled_for?: string }
interface GroupMessage { id: string; group_id: string; sender_id: string; content: string; created_at: string; reply_to_id?: string; audio_url?: string; is_pinned?: boolean; pinned_at?: string; scheduled_for?: string }
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
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110 hover:rotate-3" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}>
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><path d="M13 3L4 14h8l-1 7 9-11h-8l1-10z" fill="white" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/></svg>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)} className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-105 hover:bg-opacity-50" style={{ background: activeTab === tab.id ? (darkMode ? '#2d2d2d' : '#e8eaed') : 'transparent', color: activeTab === tab.id ? '#2563eb' : (darkMode ? '#888888' : '#666666') }}>
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
  const { profiles, friends, dms, groups, statuses } = useApp()
  const [gitCommits, setGitCommits] = useState<GitCommit[]>([])
  const now = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })

  const onlineUsers = profiles.filter(p => p.is_online)

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
    <div className="flex-1 flex flex-col h-full overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Gradient blobs */}
      <div className="absolute top-20 right-[10%] w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 left-[15%] w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-60 right-[30%] w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-8 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Velocity</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{dateStr} · {timeStr}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Widgets */}
          <div className="col-span-4 space-y-5">
            {/* Time Widget */}
            <div className="rounded-2xl p-5 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.3) 0%, rgba(6,182,212,0.2) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="relative z-10">
                <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{dateStr}</p>
                <p className="text-4xl font-bold tracking-tight text-white">{timeStr}</p>
              </div>
            </div>

            {/* Stats Grid - 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              {widgets.slice(1, 5).map((w) => (
                <div key={w.id} className="rounded-xl p-4 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] group"
                  style={{ background: 'rgba(8,15,32,0.5)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{w.icon}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{ background: `${w.color}15`, color: w.color }}>{w.title}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: w.color }}>{w.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{w.sub}</p>
                </div>
              ))}
            </div>

            {/* Online Users */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(8,15,32,0.4)', border: '1px solid rgba(59,130,246,0.08)' }}>
              <h2 className="text-xs font-semibold mb-3 flex items-center gap-2 tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online ({onlineUsers.length})
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {onlineUsers.length > 0 ? onlineUsers.map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-1 min-w-fit">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      {p.avatar_url ? <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" /> : <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{p.username[0].toUpperCase()}</span>}
                    </div>
                    <span className="text-[10px] truncate max-w-12" style={{ color: 'var(--text-primary)' }}>{p.username}</span>
                  </div>
                )) : (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No one online</p>
                )}
              </div>
            </div>
          </div>

          {/* Right content area */}
          <div className="col-span-8 space-y-5">
            {/* Git Commits - Main content */}
            <div className="rounded-2xl p-6" style={{ background: 'rgba(8,15,32,0.4)', border: '1px solid rgba(59,130,246,0.08)' }}>
              <h2 className="text-sm font-semibold mb-4 tracking-wider uppercase flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span>📢</span> What's New
              </h2>
              <div className="space-y-3">
                {gitCommits.slice(0, 6).map((commit) => (
                  <a key={commit.sha} href={commit.html_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/5 group"
                    style={{ background: 'rgba(12,22,48,0.5)', border: '1px solid rgba(59,130,246,0.06)' }}>
                    <span className="text-xl flex-shrink-0">{getCommitEmoji(commit.commit.message)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-blue-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {commit.commit.message.split('\n')[0].slice(0, 50)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>by {commit.commit.author.name}</p>
                    </div>
                    <span className="text-xs font-mono flex-shrink-0 px-2 py-1 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>{formatCommitDate(commit.commit.author.date)}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <p className="text-2xl mb-1">💬</p>
                <p className="font-semibold text-sm" style={{ color: '#60a5fa' }}>Start Chat</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Message friends</p>
              </div>
              <div className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <p className="text-2xl mb-1">👥</p>
                <p className="font-semibold text-sm" style={{ color: '#4ade80' }}>New Group</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Create a group</p>
              </div>
              <div className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <p className="text-2xl mb-1">📸</p>
                <p className="font-semibold text-sm" style={{ color: '#fbbf24' }}>Add Status</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Share an update</p>
              </div>
            </div>
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
    <div className="w-80 h-full flex flex-col relative overflow-hidden" style={{ background: 'rgba(8, 15, 32, 0.65)', borderRight: '1px solid rgba(59, 130, 246, 0.1)', backdropFilter: 'blur(24px) saturate(180%)' }}>
      {/* Glass background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-[30%] w-40 h-40 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-40 left-[10%] w-32 h-32 rounded-full bg-cyan-600/8 blur-2xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-4" style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Chats</h1>
          <div className="flex gap-1">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5" style={{ color: 'rgba(160,190,240,0.35)' }} title="New chat">✏️</button>
            <button onClick={() => setShowNewGroup(true)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5" style={{ color: 'rgba(160,190,240,0.35)' }} title="New group">👥+</button>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(12,22,48,0.6)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <span style={{ color: 'rgba(160,190,240,0.35)' }}>🔍</span>
          <input type="text" placeholder="Search conversations..." value={search} onChange={(e) => handleSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text-primary)' }} />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {showSearch && searchResults.length > 0 ? (
          <div className="p-2">
            <p className="text-xs font-semibold tracking-wider uppercase px-3 py-2" style={{ color: 'var(--text-muted)' }}>Search Results</p>
            {searchResults.map(profile => (
              <div key={profile.id} onClick={() => handleStartDM(profile.id)} className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-white/5 transition-all mx-1">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" /> : <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.username[0].toUpperCase()}</span>}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{profile.username}</p>
                  <p className="text-xs" style={{ color: profile.is_online ? '#22c55e' : 'var(--text-muted)' }}>{profile.is_online ? '● Online' : '○ Offline'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map(chat => (
              <div key={`${chat.type}-${chat.id}`} onClick={() => onSelectChat(chat.type, chat.id)} className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 group mx-1">
                <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: chat.type === 'group' ? 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' : 'rgba(12,22,48,0.6)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  {chat.avatar ? <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" /> : <span className="font-semibold text-sm" style={{ color: chat.type === 'group' ? 'white' : 'var(--text-primary)' }}>{chat.name[0].toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{chat.name}</span>
                    {chat.time && <span className="text-[10px] font-mono" style={{ color: 'rgba(160,190,240,0.35)' }}>{chat.time}</span>}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{chat.lastMsg}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: 'var(--bg-primary)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>New Group</h3>
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name" className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <div className="flex gap-2">
              <button onClick={() => setShowNewGroup(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleCreateGroup} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

interface TypingStatus {
  user_id: string
  username: string
  is_typing: boolean
  updated_at: string
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
  
  // Feature 1: Typing indicators
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Feature 2: Message reactions
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const reactionEmojis = ['❤️', '👍', '🔥', '😂', '😮', '🎉', '👏', '🤔']
  
  // Feature 3: File attachments
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Feature 4: Push notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  
  // Feature 5: Message search
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearchResults, setMessageSearchResults] = useState<(DirectMessage | GroupMessage)[]>([])
  
  // Feature 6: Threaded replies
  const [replyTo, setReplyTo] = useState<DirectMessage | GroupMessage | null>(null)
  
  // Feature 7: Voice messages
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Feature 8: Video calls
  const [activeCall, setActiveCall] = useState<{type: 'video' | 'audio', roomUrl: string} | null>(null)
  
  // Feature 9: Message drafts
  const [draftLoaded, setDraftLoaded] = useState(false)
  
  // Feature 10: Scheduled messages
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduledTime, setScheduledTime] = useState('')
  
  // Feature 11: Pinned messages
  const [pinnedMessages, setPinnedMessages] = useState<(DirectMessage | GroupMessage)[]>([])
  const [showPinned, setShowPinned] = useState(false)
  
  // Encryption
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null)
  const [isEncrypted, setIsEncrypted] = useState(true)

  // Initialize encryption key
  useEffect(() => {
    const initEncryption = async () => {
      if (!user) return
      try {
        const key = type === 'dm' 
          ? await deriveSharedKey(user.id, id)
          : await deriveGroupKey(id)
        setEncryptionKey(key)
      } catch (err) {
        console.error('Failed to initialize encryption:', err)
        setIsEncrypted(false)
      }
    }
    initEncryption()
  }, [type, id, user])

  useEffect(() => {
    const loadMessages = async () => {
      if (!encryptionKey) return
      
      if (type === 'dm') {
        supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => setProfile(data as Profile))
        const { data } = await supabase.from('direct_messages').select('*').or(`and(sender_id.eq.${user?.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user?.id})`).order('created_at')
        
        // Decrypt messages
        if (data) {
          const decrypted = await Promise.all(data.map(async (msg) => {
            const payload = parseEncryptedPayload(msg.content)
            if (payload && encryptionKey) {
              const decrypted = await decryptMessage(payload, encryptionKey)
              return { ...msg, content: decrypted || '[Decryption failed]' }
            }
            // Legacy: plaintext message
            return msg
          }))
          setMessages(decrypted)
        }
      } else {
        supabase.from('group_chats').select('*').eq('id', id).single().then(({ data }) => setGroup(data as GroupChat))
        const { data } = await supabase.from('group_messages').select('*').eq('group_id', id).order('created_at')
        
        // Decrypt messages
        if (data) {
          const decrypted = await Promise.all(data.map(async (msg) => {
            const payload = parseEncryptedPayload(msg.content)
            if (payload && encryptionKey) {
              const decrypted = await decryptMessage(payload, encryptionKey)
              return { ...msg, content: decrypted || '[Decryption failed]' }
            }
            // Legacy: plaintext message
            return msg
          }))
          setMessages(decrypted)
        }
        
        // Fetch group members
        supabase.from('group_members').select('user_id, profiles(*)').eq('group_id', id).then(({ data }) => {
          if (data) setGroupMembers(data.map(m => (m.profiles as unknown) as Profile).filter(Boolean))
        })
      }
    }
    loadMessages()
  }, [type, id, user, encryptionKey])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Feature 1: Typing indicators - Listen for typing status
  useEffect(() => {
    if (!user) return
    
    const channel = supabase.channel(`typing:${type}:${id}`)
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const typing = payload.payload as TypingStatus
      if (typing.user_id !== user.id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.user_id !== typing.user_id)
          if (typing.is_typing) {
            return [...filtered, typing]
          }
          return filtered
        })
      }
    }).subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [type, id, user])

  // Feature 2: Fetch reactions for all messages
  useEffect(() => {
    const fetchReactions = async () => {
      const messageIds = messages.map(m => m.id)
      if (messageIds.length === 0) return
      
      const { data } = await supabase.from('reactions').select('*').in('message_id', messageIds)
      if (data) setReactions(data as Reaction[])
    }
    fetchReactions()
  }, [messages])

  // Feature 4: Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true)
    }
  }, [])

  // Show notification for new messages
  useEffect(() => {
    if (!notificationsEnabled || messages.length === 0) return
    
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.sender_id === user?.id) return
    
    const sender = profiles.find(p => p.id === lastMessage.sender_id)
    if (sender && document.hidden) {
      new Notification(`${sender.username} in ${type === 'dm' ? profile?.username : group?.name}`, {
        body: lastMessage.content.slice(0, 100),
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: lastMessage.id
      })
    }
  }, [messages, notificationsEnabled, user?.id, profiles, type, profile?.username, group?.name])

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    setNotificationsEnabled(permission === 'granted')
  }

  // Feature 5: Message search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMessageSearchResults([])
      return
    }
    const filtered = messages.filter(m => 
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setMessageSearchResults(filtered)
  }, [searchQuery, messages])

  // Feature 9: Load draft on mount
  useEffect(() => {
    if (!user || draftLoaded) return
    const loadDraft = async () => {
      const { data } = await supabase.from('message_drafts')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_id', id)
        .eq('chat_type', type)
        .single()
      if (data?.content) {
        setInput(data.content)
      }
      setDraftLoaded(true)
    }
    loadDraft()
  }, [user, id, type, draftLoaded])

  // Feature 9: Auto-save draft
  useEffect(() => {
    if (!user || !draftLoaded) return
    const saveDraft = async () => {
      if (input.trim()) {
        await supabase.from('message_drafts').upsert({
          user_id: user.id,
          chat_id: id,
          chat_type: type,
          content: input,
          updated_at: new Date().toISOString()
        })
      } else {
        await supabase.from('message_drafts')
          .delete()
          .eq('user_id', user.id)
          .eq('chat_id', id)
          .eq('chat_type', type)
      }
    }
    const timeout = setTimeout(saveDraft, 1000)
    return () => clearTimeout(timeout)
  }, [input, user, id, type, draftLoaded])

  // Feature 11: Fetch pinned messages
  useEffect(() => {
    const fetchPinned = async () => {
      const table = type === 'dm' ? 'direct_messages' : 'group_messages'
      const query = type === 'dm' 
        ? supabase.from(table).select('*').or(`and(sender_id.eq.${user?.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user?.id})`).eq('is_pinned', true).order('pinned_at', { ascending: false })
        : supabase.from(table).select('*').eq('group_id', id).eq('is_pinned', true).order('pinned_at', { ascending: false })
      const { data } = await query
      if (data) setPinnedMessages(data)
    }
    fetchPinned()
  }, [type, id, user?.id, messages])

  // Feature 7: Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
  }

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    setAudioBlob(null)
    setRecordingTime(0)
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
  }

  const sendVoiceMessage = async () => {
    if (!audioBlob || !user) return
    
    setUploadingFile(true)
    try {
      const fileName = `voice_${Date.now()}.webm`
      const filePath = `${user.id}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(filePath, audioBlob)
      
      if (uploadError) throw uploadError
      
      const { data: urlData } = supabase.storage.from('voice-messages').getPublicUrl(filePath)
      
      // Send voice message
      if (type === 'dm') {
        await supabase.from('direct_messages').insert({
          sender_id: user.id,
          receiver_id: id,
          audio_url: urlData.publicUrl,
          content: '🎤 Voice message'
        })
      } else {
        await supabase.from('group_messages').insert({
          group_id: id,
          sender_id: user.id,
          audio_url: urlData.publicUrl,
          content: '🎤 Voice message'
        })
      }
      
      setAudioBlob(null)
      setRecordingTime(0)
    } catch (err) {
      console.error('Voice upload failed:', err)
    } finally {
      setUploadingFile(false)
    }
  }

  // Feature 8: Video call functions
  const startVideoCall = async (callType: 'video' | 'audio') => {
    if (!user || type !== 'dm') return
    
    const roomUrl = `https://meet.jit.si/velocity_${user.id}_${id}_${Date.now()}`
    
    // Store call record
    await supabase.from('video_calls').insert({
      caller_id: user.id,
      callee_id: id,
      status: 'ringing',
      call_type: callType,
      room_url: roomUrl
    })
    
    setActiveCall({ type: callType, roomUrl })
  }

  const endCall = () => {
    setActiveCall(null)
  }

  // Feature 6: Reply function
  const sendReply = async () => {
    if (!input.trim() || !user || !replyTo) return
    
    const content = input.trim()
    setInput('')
    setReplyTo(null)
    
    const table = type === 'dm' ? 'direct_messages' : 'group_messages'
    const insertData = type === 'dm' 
      ? { sender_id: user.id, receiver_id: id, content, reply_to_id: replyTo.id }
      : { group_id: id, sender_id: user.id, content, reply_to_id: replyTo.id }
    
    await supabase.from(table).insert(insertData)
  }

  // Feature 10: Schedule message
  const scheduleMessage = async () => {
    if (!input.trim() || !user || !scheduledTime) return
    
    const content = input.trim()
    const scheduledFor = new Date(scheduledTime).toISOString()
    
    if (type === 'dm') {
      await supabase.from('direct_messages').insert({
        sender_id: user.id,
        receiver_id: id,
        content,
        scheduled_for: scheduledFor
      })
    } else {
      await supabase.from('group_messages').insert({
        group_id: id,
        sender_id: user.id,
        content,
        scheduled_for: scheduledFor
      })
    }
    
    setInput('')
    setShowSchedule(false)
    setScheduledTime('')
  }

  // Feature 11: Pin/unpin message
  const togglePinMessage = async (msg: DirectMessage | GroupMessage) => {
    const table = type === 'dm' ? 'direct_messages' : 'group_messages'
    const newPinned = !msg.is_pinned
    
    await supabase.from(table)
      .update({ 
        is_pinned: newPinned, 
        pinned_at: newPinned ? new Date().toISOString() : null 
      })
      .eq('id', msg.id)
    
    // Refresh pinned messages
    const { data } = await supabase.from(table).select('*')
      .eq(type === 'dm' ? 'sender_id' : 'group_id', type === 'dm' ? user?.id : id)
      .eq('is_pinned', true)
    if (data) setPinnedMessages(data)
  }

  // Feature 1: Send typing status
  const sendTypingStatus = (typing: boolean) => {
    if (!user) return
    
    const channel = supabase.channel(`typing:${type}:${id}`)
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        username: user.user_metadata?.username || 'Unknown',
        is_typing: typing,
        updated_at: new Date().toISOString()
      }
    })
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    
    if (!isTyping && value.length > 0) {
      setIsTyping(true)
      sendTypingStatus(true)
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingStatus(false)
    }, 2000)
    
    if (value.length === 0) {
      setIsTyping(false)
      sendTypingStatus(false)
    }
  }

  // Feature 2: Add/remove reactions
  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return
    
    // Check if already reacted
    const existing = reactions.find(r => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji)
    if (existing) {
      // Remove reaction
      await supabase.from('reactions').delete().eq('id', existing.id)
      setReactions(prev => prev.filter(r => r.id !== existing.id))
    } else {
      // Add reaction
      const { data } = await supabase.from('reactions').insert({
        message_id: messageId,
        user_id: user.id,
        emoji
      }).select()
      if (data) setReactions(prev => [...prev, data[0] as Reaction])
    }
    setShowReactionPicker(null)
  }

  // Feature 3: Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!user || !file) return
    
    setUploadingFile(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath)
      
      // Send message with file
      const isImage = file.type.startsWith('image/')
      const content = isImage 
        ? `![${file.name}](${urlData.publicUrl})`
        : `[📎 ${file.name}](${urlData.publicUrl})`
      
      if (type === 'dm') {
        await supabase.from('direct_messages').insert({
          sender_id: user.id,
          receiver_id: id,
          content
        })
      } else {
        await supabase.from('group_messages').insert({
          group_id: id,
          sender_id: user.id,
          content
        })
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploadingFile(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !user || !encryptionKey) return
    const plaintext = input.trim()
    const tempId = `temp-${Date.now()}`
    const now = new Date().toISOString()
    
    // Encrypt message
    let encryptedContent: string
    try {
      const encrypted = await encryptMessage(plaintext, encryptionKey)
      encryptedContent = formatEncryptedPayload(encrypted)
    } catch (err) {
      console.error('Encryption failed:', err)
      // Fallback to plaintext if encryption fails
      encryptedContent = plaintext
    }
    
    // Optimistically add message to UI immediately
    if (type === 'dm') {
      const optimisticMessage: DirectMessage = {
        id: tempId,
        sender_id: user.id,
        receiver_id: id,
        content: plaintext, // Show plaintext locally
        created_at: now
      }
      setMessages(prev => [...(prev as DirectMessage[]), optimisticMessage])
      setInput('')
      
      // Send encrypted to database
      const { data } = await supabase.from('direct_messages').insert({ sender_id: user.id, receiver_id: id, content: encryptedContent }).select()
      if (data && data[0]) {
        // Replace temp message with real one from DB (decrypted)
        const decrypted = await decryptMessage(parseEncryptedPayload(data[0].content), encryptionKey)
        setMessages(prev => (prev as DirectMessage[]).map(m => m.id === tempId ? { ...data[0] as DirectMessage, content: decrypted || data[0].content } : m))
      }
    } else {
      const optimisticMessage: GroupMessage = {
        id: tempId,
        sender_id: user.id,
        group_id: id,
        content: plaintext, // Show plaintext locally
        created_at: now
      }
      setMessages(prev => [...(prev as GroupMessage[]), optimisticMessage])
      setInput('')
      
      // Send encrypted to database
      const { data } = await supabase.from('group_messages').insert({ group_id: id, sender_id: user.id, content: encryptedContent }).select()
      if (data && data[0]) {
        const decrypted = await decryptMessage(parseEncryptedPayload(data[0].content), encryptionKey)
        setMessages(prev => (prev as GroupMessage[]).map(m => m.id === tempId ? { ...data[0] as GroupMessage, content: decrypted || data[0].content } : m))
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

  // Message component with markdown, GIF, and voice message support
  const MessageContent = ({ content, audioUrl }: { content: string; audioUrl?: string }) => {
    const gifUrl = extractGifUrl(content)
    const textContent = content.replace(gifUrl || '', '').trim()
    const isVoiceMessage = content.includes('🎤 Voice message') && audioUrl
    
    return (
      <div className="space-y-2">
        {isVoiceMessage && audioUrl && (
          <div className="flex items-center gap-2">
            <audio controls className="max-w-[200px] h-8" src={audioUrl} />
          </div>
        )}
        {gifUrl && (
          <div className="rounded-xl overflow-hidden max-w-xs">
            <img src={gifUrl} alt="GIF" className="w-full h-auto" loading="lazy" />
          </div>
        )}
        {!isVoiceMessage && textContent && (
          <div 
            className="leading-relaxed text-base prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(textContent) }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Chat background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'radial-gradient(ellipse 65% 55% at 10% 15%, rgba(37,99,235,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 90% 85%, rgba(6,182,212,0.06) 0%, transparent 55%)' }} />
        <div className="absolute top-20 right-[15%] w-72 h-72 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute bottom-20 left-[10%] w-64 h-64 rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        <button onClick={() => type === 'dm' ? setShowProfileInfo(true) : setShowGroupInfo(true)} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: type === 'group' ? 'linear-gradient(135deg, #2563eb, #06b6d4)' : 'rgba(12,22,48,0.6)', border: '1px solid rgba(59,130,246,0.12)' }}>
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="font-semibold text-sm" style={{ color: type === 'group' ? 'white' : 'var(--text-primary)' }}>{title?.[0]?.toUpperCase()}</span>}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: '#60a5fa' }}>
              {/* Feature 1: Typing indicator */}
              {typingUsers.length > 0 ? (
                <span className="flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].username} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              ) : type === 'dm' ? (
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
        
        {/* Action buttons with functionality */}
        <div className="flex items-center gap-1">
          {type === 'dm' && (
            <button 
              onClick={() => startVideoCall('audio')}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5" 
              style={{ color: 'rgba(160,190,240,0.35)' }} 
              title="Voice call"
            >📞</button>
          )}
          {type === 'dm' && (
            <button 
              onClick={() => startVideoCall('video')}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5" 
              style={{ color: 'rgba(160,190,240,0.35)' }} 
              title="Video call"
            >🎥</button>
          )}
          {pinnedMessages.length > 0 && (
            <button 
              onClick={() => setShowPinned(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 relative" 
              style={{ color: 'rgba(160,190,240,0.35)' }} 
              title="Pinned messages"
            >
              📌
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[10px] flex items-center justify-center text-white">{pinnedMessages.length}</span>
            </button>
          )}
          <button 
            onClick={() => setShowSearch(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5" 
            style={{ color: 'rgba(160,190,240,0.35)' }} 
            title="Search"
          >🔍</button>
          <button 
            onClick={() => type === 'dm' ? setShowProfileInfo(true) : setShowGroupInfo(true)} 
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5" 
            style={{ color: 'rgba(160,190,240,0.35)' }} 
            title="More"
          >⋮</button>
        </div>
      </div>

      {/* Encryption Notice */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 py-1.5" style={{ background: isEncrypted ? 'rgba(37,99,235,0.06)' : 'rgba(239,68,68,0.06)', borderBottom: `1px solid ${isEncrypted ? 'rgba(37,99,235,0.08)' : 'rgba(239,68,68,0.08)'}` }}>
        <span className="text-[10px]">{isEncrypted ? '🔒' : '⚠️'}</span>
        <span className="text-[10px] tracking-wide" style={{ color: isEncrypted ? 'var(--text-muted)' : '#ef4444' }}>
          {isEncrypted ? '🔐 AES-256-GCM Encrypted · Velocity Shield™' : 'Encryption unavailable'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 relative z-10">
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === user?.id
          const sender = profiles.find(p => p.id === msg.sender_id)
          const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id)
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const isNewGroup = index === 0 || messages[index - 1].sender_id !== msg.sender_id
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 ${isNewGroup ? 'mt-4' : 'mt-1'}`}>
              {!isMe && showAvatar ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(12,22,48,0.6)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  {sender?.avatar_url ? <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{sender?.username?.[0]?.toUpperCase() || '?'}</span>}
                </div>
              ) : !isMe ? <div className="w-8 flex-shrink-0" /> : null}
              
              <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && showAvatar && sender && <span className="text-[11px] font-semibold ml-1" style={{ color: 'rgba(191,219,254,0.7)' }}>{sender.username}</span>}
                <div className="relative group/message">
                  <div className={`relative px-4 py-2.5 text-[13.5px] leading-relaxed ${isMe ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}
                    style={{ 
                      background: isMe ? 'rgba(37, 99, 235, 0.82)' : 'rgba(12, 22, 50, 0.6)',
                      border: isMe ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(59,130,246,0.1)',
                      color: isMe ? '#dbeafe' : 'var(--text-primary)',
                      boxShadow: isMe ? '0 2px 16px rgba(37,99,235,0.25)' : '0 2px 12px rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(16px)'
                    }}>
                    {isMe && <div className="absolute inset-0 pointer-events-none rounded-2xl rounded-br-md" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />}
                    <div className="relative z-10">
                      {/* Feature 6: Show reply reference */}
                      {(msg as any).reply_to_id && (
                        <div className="mb-2 px-2 py-1 rounded text-xs opacity-70" style={{ background: 'rgba(0,0,0,0.2)', borderLeft: '2px solid rgba(96,165,250,0.5)' }}>
                          <span style={{ color: 'rgba(160,190,240,0.8)' }}>Replying to message</span>
                        </div>
                      )}
                      {/* Feature 7: Show voice messages */}
                      <MessageContent content={msg.content} audioUrl={(msg as any).audio_url} />
                    </div>
                  </div>
                  
                  {/* Feature 2, 6, 11: Action buttons - appears on hover */}
                  <div className={`absolute -top-3 opacity-0 group-hover/message:opacity-100 transition-opacity z-20 flex gap-1`}
                    style={{ [isMe ? 'left' : 'right']: '-40px' }}>
                    <button 
                      onClick={() => setReplyTo(msg)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ 
                        background: 'rgba(12,22,48,0.9)', 
                        border: '1px solid rgba(59,130,246,0.2)',
                        color: 'rgba(160,190,240,0.6)'
                      }}
                      title="Reply"
                    >↩️</button>
                    <button 
                      onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ 
                        background: 'rgba(12,22,48,0.9)', 
                        border: '1px solid rgba(59,130,246,0.2)',
                        color: 'rgba(160,190,240,0.6)'
                      }}
                    >
                      😊
                    </button>
                    <button 
                      onClick={() => togglePinMessage(msg)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ 
                        background: msg.is_pinned ? 'rgba(37,99,235,0.5)' : 'rgba(12,22,48,0.9)', 
                        border: '1px solid rgba(59,130,246,0.2)',
                        color: msg.is_pinned ? '#60a5fa' : 'rgba(160,190,240,0.6)'
                      }}
                      title={msg.is_pinned ? 'Unpin' : 'Pin'}
                    >📌</button>
                  </div>
                  
                  {/* Feature 2: Reaction picker */}
                  {showReactionPicker === msg.id && (
                    <div className={`absolute -top-12 z-30 flex items-center gap-1 p-1.5 rounded-xl shadow-xl`}
                      style={{ 
                        background: 'rgba(12,22,48,0.95)', 
                        border: '1px solid rgba(59,130,246,0.2)',
                        [isMe ? 'right' : 'left']: '0'
                      }}>
                      {reactionEmojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(msg.id, emoji)}
                          className="w-7 h-7 rounded-lg hover:bg-white/10 transition-all text-base flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Feature 2: Display reactions */}
                {(() => {
                  const msgReactions = reactions.filter(r => r.message_id === msg.id)
                  if (msgReactions.length === 0) return null
                  
                  const grouped = msgReactions.reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  
                  return (
                    <div className={`flex gap-1 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {Object.entries(grouped).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(msg.id, emoji)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all hover:scale-105"
                          style={{ 
                            background: reactions.find(r => r.message_id === msg.id && r.user_id === user?.id && r.emoji === emoji)
                              ? 'rgba(37,99,235,0.4)' 
                              : 'rgba(12,22,48,0.6)',
                            border: '1px solid rgba(59,130,246,0.15)'
                          }}
                        >
                          <span>{emoji}</span>
                          <span style={{ color: 'rgba(160,190,240,0.8)' }}>{count}</span>
                        </button>
                      ))}
                    </div>
                  )
                })()}
                
                <span className="text-[9px] font-mono px-1" style={{ color: 'rgba(160,190,240,0.35)' }}>{time} {isMe && '✓✓'}</span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area with file upload, voice recording, reply, and schedule */}
      <div className="relative z-10 p-3" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Feature 6: Reply preview */}
        {replyTo && (
          <div className="mb-2 px-3 py-2 rounded-xl flex items-center justify-between" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'rgba(160,190,240,0.6)' }}>↩️ Replying to:</span>
              <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>{replyTo.content.slice(0, 50)}...</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-xs px-2 py-1 rounded hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>✕</button>
          </div>
        )}
        
        {/* Feature 7: Voice recording UI */}
        {isRecording ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono" style={{ color: '#ef4444' }}>{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Recording...</span>
            <div className="flex-1" />
            <button onClick={cancelRecording} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            <button onClick={stopRecording} className="px-4 py-1.5 rounded-lg text-sm text-white" style={{ background: '#ef4444' }}>Stop</button>
          </div>
        ) : audioBlob ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>🎤 Voice message ready</span>
            <div className="flex-1" />
            <button onClick={() => { setAudioBlob(null); setRecordingTime(0); }} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--text-muted)' }}>Cancel</button>
            <button onClick={sendVoiceMessage} disabled={uploadingFile} className="px-4 py-1.5 rounded-lg text-sm text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
              {uploadingFile ? 'Sending...' : 'Send'}
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            {/* Feature 3: File attachment */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }} 
              title="Attach"
            >
              {uploadingFile ? (
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : '📎'}
            </button>
            
            {/* Feature 7: Voice message button */}
            <button 
              onClick={startRecording}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }} 
              title="Voice message"
            >
              🎤
            </button>
            
            <div className="flex-1 flex items-end gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(12, 22, 48, 0.7)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <textarea 
                value={input} 
                onChange={(e) => handleInputChange(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); replyTo ? sendReply() : sendMessage(); } }} 
                placeholder={replyTo ? "Reply to message..." : "Message"} 
                rows={1}
                className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed max-h-28"
                style={{ color: 'var(--text-primary)', minHeight: '22px', fontFamily: '"Plus Jakarta Sans", sans-serif' }} />
              <button className="text-lg leading-none pb-0.5 transition-transform hover:scale-110" style={{ color: 'var(--text-muted)' }}>😄</button>
            </div>
            
            {/* Feature 10: Schedule button */}
            <button 
              onClick={() => setShowSchedule(true)}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              title="Schedule"
            >
              ⏰
            </button>
            
            <button 
              onClick={replyTo ? sendReply : sendMessage} 
              disabled={!input.trim()} 
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', color: 'white', boxShadow: '0 0 18px rgba(37,99,235,0.35)' }}>
              {replyTo ? '↩️' : '➤'}
            </button>
          </div>
        )}
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
              <button className="flex-1 py-3 rounded-xl font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>Message</button>
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
              <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>
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
              <button onClick={() => { setShowGroupInfo(false); setShowInvite(true); }} className="flex-1 py-3 rounded-xl font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>Add Member</button>
              <button onClick={() => setShowGroupInfo(false)} className="flex-1 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 5: Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-3xl p-6" style={{ background: 'var(--bg-primary)', maxHeight: '80vh' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>🔍 Search Messages</h3>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search in conversation..." 
              className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              autoFocus
            />
            <div className="overflow-y-auto space-y-2" style={{ maxHeight: '50vh' }}>
              {messageSearchResults.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No messages found' : 'Type to search messages'}
                </p>
              ) : (
                messageSearchResults.map(msg => {
                  const sender = profiles.find(p => p.id === msg.sender_id)
                  return (
                    <div key={msg.id} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{sender?.username || 'Unknown'}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{msg.content.slice(0, 200)}</p>
                    </div>
                  )
                })
              )}
            </div>
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="w-full mt-4 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Close</button>
          </div>
        </div>
      )}

      {/* Feature 11: Pinned Messages Modal */}
      {showPinned && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-3xl p-6" style={{ background: 'var(--bg-primary)', maxHeight: '80vh' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>📌 Pinned Messages</h3>
            <div className="overflow-y-auto space-y-2" style={{ maxHeight: '50vh' }}>
              {pinnedMessages.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No pinned messages</p>
              ) : (
                pinnedMessages.map(msg => {
                  const sender = profiles.find(p => p.id === msg.sender_id)
                  return (
                    <div key={msg.id} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{sender?.username || 'Unknown'}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{msg.content}</p>
                    </div>
                  )
                })
              )}
            </div>
            <button onClick={() => setShowPinned(false)} className="w-full mt-4 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Close</button>
          </div>
        </div>
      )}

      {/* Feature 8: Video Call Overlay */}
      {activeCall && (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#0a0a0f' }}>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
                <span className="text-4xl">{activeCall.type === 'video' ? '🎥' : '📞'}</span>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {activeCall.type === 'video' ? 'Video Call' : 'Voice Call'}
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{title}</p>
              <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>Connecting...</p>
              <a 
                href={activeCall.roomUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-6 px-6 py-3 rounded-xl font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
              >
                Join Call
              </a>
            </div>
          </div>
          <div className="p-6 flex justify-center">
            <button 
              onClick={endCall}
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ background: '#ef4444', color: 'white' }}
            >
              📞
            </button>
          </div>
        </div>
      )}

      {/* Feature 10: Schedule Message Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: 'var(--bg-primary)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>⏰ Schedule Message</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Message will be sent automatically at the scheduled time.</p>
            <input 
              type="datetime-local" 
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm mb-4 outline-none"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-3">
              <button 
                onClick={scheduleMessage}
                disabled={!scheduledTime}
                className="flex-1 py-3 rounded-xl font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}
              >
                Schedule
              </button>
              <button 
                onClick={() => { setShowSchedule(false); setScheduledTime(''); }}
                className="flex-1 py-3 rounded-xl font-medium"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
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
  const otherStatuses = user ? statuses.filter(s => s.user_id !== user.id) : statuses

  const handleAddStatus = async () => {
    if (!user || (!content.trim() && !mediaUrl.trim())) return
    await supabase.from('status_updates').insert({ user_id: user.id, content: content.trim(), media_url: mediaUrl.trim() || null, media_type: mediaUrl ? statusType : null })
    setShowAddModal(false)
    setContent('')
    setMediaUrl('')
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Gradient blobs */}
      <div className="absolute top-20 right-[15%] w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-[10%] w-72 h-72 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-40 left-[40%] w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4" style={{ borderBottom: '1px solid var(--border)' }}><h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Status</h1></div>
      <div className="relative z-10 flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-black/5" onClick={() => setShowAddModal(true)}>
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)', padding: '2px' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>You</div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>
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
                    {s.media_url ? <div className="w-full h-full rounded-full overflow-hidden"><img src={s.media_url} alt="" className="w-full h-full object-cover" /></div> : <div className="w-full h-full rounded-full flex items-center justify-center font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>{profile?.username?.[0] || '?'}</div>}
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
                <button key={t} onClick={() => setStatusType(t)} className="flex-1 py-2 rounded-lg text-sm font-medium capitalize" style={{ background: statusType === t ? 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' : 'var(--bg-tertiary)', color: statusType === t ? 'white' : 'var(--text-secondary)' }}>{t}</button>
              ))}
            </div>
            {statusType === 'text' ? <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind?" className="w-full h-24 p-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} /> : <input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder={`Enter ${statusType} URL`} className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleAddStatus} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CallsPage() {
  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Gradient blobs */}
      <div className="absolute top-20 right-[10%] w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-[15%] w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-[30%] w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4" style={{ borderBottom: '1px solid var(--border)' }}><h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Calls</h1></div>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    if (user) supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => { if (data) { setUsername(data.username || ''); setDescription(data.description || ''); setPhone(data.phone || '') } })
    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [user])

  const saveProfile = async () => { if (!user) return; await supabase.from('profiles').update({ username, description, phone }).eq('id', user.id) }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Gradient blobs */}
      <div className="absolute top-20 left-[10%] w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 right-[20%] w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-60 right-[10%] w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4" style={{ borderBottom: '1px solid var(--border)' }}><h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1></div>
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>PROFILE</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>{user?.email?.[0].toUpperCase()}</div>
              <div><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.email?.split('@')[0]}</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p></div>
            </div>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bio" className="w-full p-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full p-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            <button onClick={saveProfile} className="w-full py-3 rounded-xl font-medium text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }}>Save Profile</button>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>APPEARANCE</h2>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Dark Mode</span>
            <button onClick={() => setDarkMode(!darkMode)} className="w-12 h-6 rounded-full transition-colors relative" style={{ background: darkMode ? 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' : 'var(--border-strong)' }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: darkMode ? '28px' : '4px' }} />
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>NOTIFICATIONS</h2>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Push Notifications</span>
            </div>
            <button 
              onClick={() => {
                if (!notificationsEnabled) {
                  if ('Notification' in window) {
                    Notification.requestPermission().then(permission => {
                      if (permission === 'granted') {
                        setNotificationsEnabled(true)
                        new Notification('Velocity', { body: 'Notifications enabled!', icon: '/vite.svg' })
                      }
                    })
                  }
                }
              }}
              disabled={notificationsEnabled}
              className="w-12 h-6 rounded-full transition-colors relative disabled:opacity-60"
              style={{ background: notificationsEnabled ? 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)' : 'var(--border-strong)' }}
            >
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: notificationsEnabled ? '28px' : '4px' }} />
            </button>
          </div>
          <p className="text-xs mt-2 px-1" style={{ color: 'var(--text-muted)' }}>
            {notificationsEnabled ? 'Notifications are enabled. You\'ll receive alerts for new messages when the app is in the background.' : 'Enable to receive alerts for new messages.'}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>ABOUT</h2>
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <p className="font-semibold" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Velocity</p>
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

  if (loading) return <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}><div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: '#2563eb' }} /></div>
  if (!user) return <Navigate to="/login" />

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, activeTab, setActiveTab: handleTabChange, profiles, groups, friends, dms, statuses, user, signOut, refresh }}>
      <div className="h-screen w-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'chat' && (<>
          <ChatList onSelectChat={(type, id) => setSelectedChat({ type, id })} />
          {selectedChat ? <ChatArea type={selectedChat.type} id={selectedChat.id} /> : (
            <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
              {/* Gradient blobs */}
              <div className="absolute top-20 right-[20%] w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-20 left-[15%] w-72 h-72 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 text-center p-8">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                  <svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Select a chat</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Choose from your existing conversations</p>
              </div>
            </div>
          )}
        </>)}
        {activeTab === 'status' && <StatusPage />}
        {activeTab === 'calls' && <CallsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </div>
    </AppContext.Provider>
  )
}
