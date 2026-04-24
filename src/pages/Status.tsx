import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { InputModal } from '../components/Modal'

interface StatusUpdate {
  id: string
  user_id: string
  content: string | null
  media_url: string | null
  media_type: string | null
  created_at: string
  profile?: {
    username: string
    avatar_url: string
  }
}

export default function Status() {
  const [statuses, setStatuses] = useState<StatusUpdate[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusType, setStatusType] = useState<'text' | 'image' | 'video'>('text')
  const [statusContent, setStatusContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    const { data } = await supabase
      .from('status_updates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) {
      const statusesWithProfiles = await Promise.all(data.map(async (s) => {
        const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', s.user_id).single()
        return { ...s, profile }
      }))
      setStatuses(statusesWithProfiles)
    }
  }

  const handleAddStatus = async () => {
    if (!user || (!statusContent.trim() && !mediaUrl.trim())) return

    await supabase.from('status_updates').insert({
      user_id: user.id,
      content: statusContent.trim(),
      media_url: mediaUrl.trim() || null,
      media_type: mediaUrl ? statusType : null
    })

    setShowAddModal(false)
    setStatusContent('')
    setMediaUrl('')
    fetchStatuses()
  }

  const myStatuses = user ? statuses.filter(s => s.user_id === user.id) : []
  const otherStatuses = user ? statuses.filter(s => s.user_id !== user.id) : statuses

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ background: '#1a1a1a' }}>
        <h1 className="text-xl font-semibold text-white">Status</h1>
      </div>

      {/* My Status */}
      <div className="px-4 py-3">
        <div 
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => setShowAddModal(true)}
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: '#252525', padding: '3px' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold text-lg" style={{ background: '#252525' }}>
                You
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#00D1FF' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">My Status</p>
            <p className="text-sm" style={{ color: '#888888' }}>Tap to add status update</p>
          </div>
        </div>
      </div>

      {/* My Status List */}
      {myStatuses.length > 0 && (
        <div className="px-4">
          <p className="text-sm font-medium py-2" style={{ color: '#888888' }}>My updates</p>
          {myStatuses.map((status) => (
            <div key={status.id} className="flex items-center gap-3 p-3 rounded-xl">
              {status.media_url ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden" style={{ background: '#252525' }}>
                  {status.media_type === 'video' ? (
                    <video src={status.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={status.media_url} alt="status" className="w-full h-full object-cover" />
                  )}
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center p-3" style={{ background: '#252525' }}>
                  <p className="text-white text-sm text-center">{status.content}</p>
                </div>
              )}
              <div className="flex-1">
                <p className="text-white text-sm">{status.content || 'Media status'}</p>
                <p className="text-xs" style={{ color: '#888888' }}>{new Date(status.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Updates */}
      {otherStatuses.length > 0 && (
        <div className="px-4 mt-4">
          <p className="text-sm font-medium py-2" style={{ color: '#888888' }}>Recent updates</p>
          <div className="space-y-1">
            {otherStatuses.map((status) => (
              <div
                key={status.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: '#252525', padding: '2px' }}>
                  {status.media_url ? (
                    status.media_type === 'video' ? (
                      <video src={status.media_url} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <img src={status.media_url} alt="status" className="w-full h-full object-cover rounded-full" />
                    )
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold" style={{ background: '#00D1FF' }}>
                      {status.profile?.username?.[0] || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{status.profile?.username || 'Unknown'}</p>
                  <p className="text-sm" style={{ color: '#888888' }}>{new Date(status.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {otherStatuses.length === 0 && myStatuses.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ background: '#252525' }}>
            <svg className="w-12 h-12" style={{ color: '#3a3a3a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white font-medium mb-1">No status updates</p>
          <p className="text-sm" style={{ color: '#888888' }}>Tap the + button to share a status</p>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="h-16 flex items-center justify-around" style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
        <Link to="/" className="flex flex-col items-center gap-1" style={{ color: '#888888' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs">Chats</span>
        </Link>
        <button className="flex flex-col items-center gap-1" style={{ color: '#00D1FF' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs">Status</span>
        </button>
        <Link to="/calls" className="flex flex-col items-center gap-1" style={{ color: '#888888' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-xs">Calls</span>
        </Link>
      </div>
    </div>
  )
}
