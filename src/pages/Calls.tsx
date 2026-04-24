import { useState } from 'react'
import { Link } from 'react-router-dom'

interface CallLog {
  id: string
  name: string
  avatar: string
  time: string
  type: 'incoming' | 'outgoing' | 'missed'
  duration?: string
}

export default function Calls() {
  const [calls] = useState<CallLog[]>([
    { id: '1', name: 'John', avatar: '', time: 'Today, 2:30 PM', type: 'incoming', duration: '5:32' },
    { id: '2', name: 'Sarah', avatar: '', time: 'Today, 11:15 AM', type: 'outgoing', duration: '2:15' },
    { id: '3', name: 'Mike', avatar: '', time: 'Yesterday, 8:45 PM', type: 'missed' },
    { id: '4', name: 'Emily', avatar: '', time: 'Yesterday, 6:20 PM', type: 'incoming', duration: '12:45' },
  ])

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ background: '#1a1a1a' }}>
        <h1 className="text-xl font-semibold text-white">Calls</h1>
      </div>

      {/* Call Logs */}
      <div className="flex-1">
        {calls.length > 0 ? (
          <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
            {calls.map((call) => (
              <div
                key={call.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#252525' }}>
                  <div className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold" style={{ background: call.type === 'missed' ? '#3a2525' : '#00D1FF' }}>
                    {call.name[0]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{call.name}</p>
                  <div className="flex items-center gap-1">
                    {call.type === 'incoming' && (
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                    {call.type === 'outgoing' && (
                      <svg className="w-4 h-4" style={{ color: '#888888' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    )}
                    {call.type === 'missed' && (
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                      </svg>
                    )}
                    <span className="text-sm" style={{ color: '#888888' }}>
                      {call.time}
                      {call.duration && ` • ${call.duration}`}
                    </span>
                  </div>
                </div>
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" style={{ color: call.type === 'missed' ? '#ef4444' : '#00D1FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ background: '#252525' }}>
              <svg className="w-12 h-12" style={{ color: '#3a3a3a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No calls yet</p>
            <p className="text-sm" style={{ color: '#888888' }}>Start a call from a chat</p>
          </div>
        )}
      </div>

      {/* Create Call Button */}
      <div className="px-4 py-4" style={{ background: '#1a1a1a' }}>
        <button className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90" style={{ background: '#252525', color: '#00D1FF' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create call link
        </button>
      </div>

      {/* Bottom Tab Bar */}
      <div className="h-16 flex items-center justify-around" style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
        <Link to="/" className="flex flex-col items-center gap-1" style={{ color: '#888888' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs">Chats</span>
        </Link>
        <Link to="/status" className="flex flex-col items-center gap-1" style={{ color: '#888888' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs">Status</span>
        </Link>
        <button className="flex flex-col items-center gap-1" style={{ color: '#00D1FF' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-xs">Calls</span>
        </button>
      </div>
    </div>
  )
}
