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
      <div className="h-20 flex items-center justify-around" style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
        <Link to="/home" className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#888888' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm font-medium">Home</span>
        </Link>
        <Link to="/" className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#888888' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">Chats</span>
        </Link>
        <button className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#00D1FF' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Status</span>
        </button>
        <Link to="/calls" className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#888888' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-sm font-medium">Calls</span>
        </Link>
      </div>

      {/* Add Status Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <h3 className="text-xl font-bold text-white mb-4">Add Status</h3>
            
            {/* Type Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setStatusType('text')}
                className="flex-1 py-2 rounded-lg font-medium transition-all"
                style={{ background: statusType === 'text' ? '#00D1FF' : '#252525', color: statusType === 'text' ? 'white' : '#888888' }}
              >
                Text
              </button>
              <button
                onClick={() => setStatusType('image')}
                className="flex-1 py-2 rounded-lg font-medium transition-all"
                style={{ background: statusType === 'image' ? '#00D1FF' : '#252525', color: statusType === 'image' ? 'white' : '#888888' }}
              >
                Image
              </button>
              <button
                onClick={() => setStatusType('video')}
                className="flex-1 py-2 rounded-lg font-medium transition-all"
                style={{ background: statusType === 'video' ? '#00D1FF' : '#252525', color: statusType === 'video' ? 'white' : '#888888' }}
              >
                Video
              </button>
            </div>

            {/* Content Input */}
            {statusType === 'text' ? (
              <textarea
                value={statusContent}
                onChange={(e) => setStatusContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 p-4 rounded-xl bg-transparent text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#00D1FF] resize-none"
              />
            ) : (
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={statusType === 'image' ? 'Enter image URL' : 'Enter video URL'}
                className="w-full p-4 rounded-xl bg-transparent text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#00D1FF]"
              />
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl font-medium"
                style={{ background: '#252525', color: '#888888' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddStatus}
                className="flex-1 py-3 rounded-xl font-medium"
                style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)', color: 'white' }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
