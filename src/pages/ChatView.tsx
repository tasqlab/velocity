import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

interface Chat {
  id: string
  name: string
  icon_url: string | null
}

export default function ChatView() {
  const { chatId } = useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chat, setChat] = useState<Chat | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!chatId || !user) return

    fetchChat()
    fetchMessages()

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_id=eq.${chatId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchChat = async () => {
    const { data } = await supabase
      .from('servers')
      .select('*')
      .eq('id', chatId)
      .single()
    
    if (data) {
      setChat(data)
    }
  }

  const fetchMessages = async () => {
    const { data: channels } = await supabase
      .from('channels')
      .select('id')
      .eq('server_id', chatId)
      .limit(1)
      .single()

    if (!channels) return

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channels.id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (data) setMessages(data)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) return

    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('server_id', chatId)
      .limit(1)
      .single()

    if (!channel) {
      const { data: newChannel } = await supabase
        .from('channels')
        .insert({
          server_id: chatId,
          name: 'general',
          type: 'text'
        })
        .select()
        .single()
      
      if (!newChannel) return
      
      await supabase.from('messages').insert({
        channel_id: newChannel.id,
        sender_id: user.id,
        content: newMessage.trim()
      })
    } else {
      await supabase.from('messages').insert({
        channel_id: channel.id,
        sender_id: user.id,
        content: newMessage.trim()
      })
    }

    setNewMessage('')
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const quickEmojis = ['😀', '😂', '❤️', '👍', '🔥', '🎉', '😊', '😍', '🤔', '👋']

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="h-14 px-4 flex items-center gap-3" style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <Link to="/" className="p-1 rounded-full hover:bg-white/10 transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: '#252525' }}>
            {chat?.icon_url ? (
              <img src={chat.icon_url} alt={chat.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                {chat?.name?.[0] || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-white">{chat?.name || 'Chat'}</div>
            <div className="text-xs" style={{ color: isTyping ? '#53deb6' : '#888888' }}>
              {isTyping ? 'typing...' : 'online'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: '#252525' }}>
              {chat?.icon_url ? (
                <img src={chat.icon_url} alt={chat.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-3xl text-white font-bold">{chat?.name?.[0] || '?'}</span>
              )}
            </div>
            <p className="text-white font-medium text-lg">{chat?.name}</p>
            <p className="text-sm mt-1" style={{ color: '#888888' }}>Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[75%] px-4 py-2 rounded-2xl"
                  style={{
                    background: isOwn ? '#00D1FF' : '#252525',
                    color: isOwn ? 'white' : '#e9e9e9',
                    borderBottomRightRadius: isOwn ? '4px' : '16px',
                    borderBottomLeftRadius: isOwn ? '16px' : '4px'
                  }}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs" style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : '#888888' }}>
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis */}
      {showEmojiPicker && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto" style={{ background: '#1a1a1a' }}>
          {quickEmojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => {
                setNewMessage(prev => prev + emoji)
                setShowEmojiPicker(false)
              }}
              className="text-2xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: '#252525' }}>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message"
            className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-sm"
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="p-3 rounded-full transition-all disabled:opacity-50"
          style={{ background: newMessage.trim() ? 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' : '#252525' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
