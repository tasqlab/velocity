import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  activeTab: 'chats' | 'status' | 'calls'
  setActiveTab: (tab: 'chats' | 'status' | 'calls') => void
}

export default function WhatsAppLayout({ activeTab, setActiveTab }: Props) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isChatView = location.pathname.startsWith('/chat/')

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      <Outlet />
      
      {isChatView && (
        <div className="h-16 flex items-center justify-around" style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
          <button
            onClick={() => setActiveTab('chats')}
            className="flex flex-col items-center gap-1 py-2 px-6 rounded-lg transition-all"
            style={{ color: activeTab === 'chats' ? '#00D1FF' : '#888888' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">Chats</span>
          </button>
          
          <button
            onClick={() => setActiveTab('status')}
            className="flex flex-col items-center gap-1 py-2 px-6 rounded-lg transition-all"
            style={{ color: activeTab === 'status' ? '#00D1FF' : '#888888' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Status</span>
          </button>
          
          <button
            onClick={() => setActiveTab('calls')}
            className="flex flex-col items-center gap-1 py-2 px-6 rounded-lg transition-all"
            style={{ color: activeTab === 'calls' ? '#00D1FF' : '#888888' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-xs">Calls</span>
          </button>
        </div>
      )}
    </div>
  )
}
