import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  channel_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: {
    username: string
    avatar_url: string
  }
}

interface Channel {
  id: string
  name: string
}

export default function Server() {
  const { serverId, channelId } = useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [channel, setChannel] = useState<Channel | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!channelId) return

    const fetchChannel = async () => {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single()

      if (data) setChannel(data)
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(username, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) setMessages(data)
    }

    fetchChannel()
    fetchMessages()

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, async (payload) => {
        const { data } = await supabase
          .from('messages')
          .select('*, profiles(username, avatar_url)')
          .eq('id', payload.new.id)
          .single()

        if (data) {
          setMessages(prev => [...prev, data])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !channelId || sending) return

    setSending(true)
    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      channel_id: channelId,
      user_id: user.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      profiles: {
        username: user.email?.split('@')[0] || 'You',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
      }
    }

    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')

    try {
      const { error } = await supabase.from('messages').insert({
        channel_id: channelId,
        user_id: user.id,
        content: newMessage.trim()
      })

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== tempId))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString()
  }

  if (!channelId) {
    return (
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-velocity-bg via-transparent to-velocity-bg" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(0,209,255,0.2) 0%, rgba(0,209,255,0.05) 100%)', border: '1px solid rgba(0,209,255,0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-velocity-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-velocity-text to-velocity-textMuted mb-3">Welcome to Server</h2>
          <p className="text-velocity-textMuted text-lg">Select a channel from the sidebar to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-velocity-bg/90 to-velocity-bg" />
      
      <div className="relative z-10 h-14 px-4 flex items-center border-b" style={{ background: 'rgba(20,23,28,0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}>
            <span className="text-lg font-bold text-velocity-bg">#</span>
          </span>
          <span className="text-lg font-semibold text-velocity-text">{channel?.name}</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => {
          const showDate = index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at)

          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,209,255,0.1)', color: '#00D1FF', border: '1px solid rgba(0,209,255,0.2)' }}>{formatDate(message.created_at)}</span>
                  <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />
                </div>
              )}
              <div className="flex gap-4 hover:bg-velocity-surface/20 -mx-2 px-2 py-2 rounded-xl transition-colors group">
                <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden transition-all duration-200 group-hover:shadow-[0_0_15px_rgba(0,209,255,0.3)]" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}>
                  {message.profiles?.avatar_url ? (
                    <img src={message.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-velocity-bg font-bold text-lg">
                      {message.profiles?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-semibold text-velocity-text">{message.profiles?.username || 'Unknown'}</span>
                    <span className="text-xs text-velocity-textMuted">{formatTime(message.created_at)}</span>
                  </div>
                  <p className="text-velocity-text whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="relative z-10 p-4">
        <div className="flex items-center rounded-2xl px-4 transition-all duration-200 focus-within:shadow-[0_0_20px_rgba(0,209,255,0.2)]" style={{ background: 'rgba(20,23,28,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${channel?.name}`}
            className="flex-1 py-4 bg-transparent text-velocity-text placeholder-velocity-textMuted focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: newMessage.trim() ? 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' : 'transparent' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: newMessage.trim() ? '#0B0E11' : '#8A9199' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
