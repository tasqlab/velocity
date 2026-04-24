import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { InputModal, ActionModal } from '../components/Modal'

interface Profile {
  id: string
  username: string
  avatar_url: string | null
  description: string | null
  phone: string | null
  is_online: boolean
}

interface DirectMessage {
  id: string
  receiver_id: string
  receiver?: Profile
  content: string
  created_at: string
}

interface GroupChat {
  id: string
  name: string
  avatar_url: string | null
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [dms, setDms] = useState<DirectMessage[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showNewGroupModal, setShowNewGroupModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    
    // Fetch all profiles for search
    const { data: profilesData } = await supabase.from('profiles').select('*')
    if (profilesData) setProfiles(profilesData.filter(p => p.id !== user.id))

    // Fetch friends
    const { data: friendsData } = await supabase
      .from('friends')
      .select('friend_id, profiles(*)')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
    if (friendsData) setFriends(friendsData.map(f => f.profiles as Profile))

    // Fetch DMs
    const { data: dmData } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (dmData) {
      const dmWithProfiles = await Promise.all(dmData.map(async (dm) => {
        const otherId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherId).single()
        return { ...dm, receiver: profile }
      }))
      setDms(dmWithProfiles)
    }

    // Fetch groups
    const { data: groupData } = await supabase
      .from('group_members')
      .select('group_id, group_chats(*)')
      .eq('user_id', user.id)
    if (groupData) setGroups(groupData.map(g => g.group_chats as GroupChat))
  }

  const handleStartDM = async (profileId: string) => {
    if (!user) return
    
    // Create or find existing DM
    const { data: existing } = await supabase
      .from('direct_messages')
      .select('id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user.id})`)
      .limit(1)
    
    if (existing && existing.length > 0) {
      navigate(`/dm/${profileId}`)
    } else {
      navigate(`/dm/${profileId}`)
    }
    setShowNewChatModal(false)
    setSearchQuery('')
  }

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return

    const { data: group } = await supabase
      .from('group_chats')
      .insert({ name: newGroupName, created_by: user.id })
      .select()
      .single()

    if (group) {
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin'
      })
      navigate(`/group/${group.id}`)
    }
    setShowNewGroupModal(false)
    setNewGroupName('')
  }

  const handleAddFriend = async (profileId: string) => {
    if (!user) return
    await supabase.from('friends').insert({
      user_id: user.id,
      friend_id: profileId,
      status: 'pending'
    })
    fetchData()
  }

  const filteredProfiles = profiles.filter(p => 
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="h-20 px-8 flex items-center justify-between" style={{ background: '#1a1a1a' }}>
        <div className="flex items-center gap-5">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}
          >
            {user?.email?.[0].toUpperCase()}
          </button>
          <span className="font-semibold text-xl text-white">Home</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNewGroupModal(true)}
            className="p-3 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="p-3 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-4" style={{ background: '#1a1a1a' }}>
        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl" style={{ background: '#252525' }}>
          <svg className="w-6 h-6" style={{ color: '#888888' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Search Results */}
        {searchQuery ? (
          <div className="py-4">
            <p className="text-sm font-medium px-4 py-2" style={{ color: '#888888' }}>People</p>
            {filteredProfiles.map(profile => (
              <div
                key={profile.id}
                className="flex items-center gap-5 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => handleStartDM(profile.id)}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#252525' }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
                      {profile.username[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{profile.username}</span>
                    {profile.is_online && (
                      <span className="w-2 h-2 rounded-full" style={{ background: '#00D1FF' }} />
                    )}
                  </div>
                  {profile.description && (
                    <p className="text-sm truncate" style={{ color: '#888888' }}>{profile.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddFriend(profile.id); }}
                  className="p-2 rounded-full hover:bg-white/10"
                >
                  <svg className="w-5 h-5" style={{ color: '#00D1FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Groups */}
            {groups.length > 0 && (
              <div className="py-4">
                <p className="text-sm font-medium px-4 py-2" style={{ color: '#888888' }}>Groups</p>
                {groups.map(group => (
                  <Link
                    key={group.id}
                    to={`/group/${group.id}`}
                    className="flex items-center gap-5 px-6 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#252525' }}>
                      {group.avatar_url ? (
                        <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
                          {group.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-white">{group.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Friends */}
            {friends.length > 0 && (
              <div className="py-4">
                <p className="text-sm font-medium px-4 py-2" style={{ color: '#888888' }}>Friends</p>
                {friends.map(friend => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-5 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleStartDM(friend.id)}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#252525' }}>
                        {friend.avatar_url ? (
                          <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
                            {friend.username[0]}
                          </div>
                        )}
                      </div>
                      {friend.is_online && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2" style={{ borderColor: '#1a1a1a', background: '#00D1FF' }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-white">{friend.username}</span>
                      {friend.description && (
                        <p className="text-sm truncate" style={{ color: '#888888' }}>{friend.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DMs */}
            {dms.length > 0 && (
              <div className="py-4">
                <p className="text-sm font-medium px-4 py-2" style={{ color: '#888888' }}>Messages</p>
                {dms.map(dm => (
                  <div
                    key={dm.id}
                    className="flex items-center gap-5 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => dm.receiver && navigate(`/dm/${dm.receiver.id}`)}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#252525' }}>
                      {dm.receiver?.avatar_url ? (
                        <img src={dm.receiver.avatar_url} alt={dm.receiver.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
                          {dm.receiver?.username?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-white">{dm.receiver?.username}</span>
                      <p className="text-sm truncate" style={{ color: '#888888' }}>{dm.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {groups.length === 0 && friends.length === 0 && dms.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
                <svg className="w-20 h-20 mb-4" style={{ color: '#3a3a3a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-white font-medium mb-1">No conversations yet</p>
                <p className="text-sm" style={{ color: '#888888' }}>Search for people to start chatting</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="h-20 flex items-center justify-around" style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
        <Link to="/home" className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#00D1FF' }}>
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
        <Link to="/status" className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#888888' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Status</span>
        </Link>
        <Link to="/calls" className="flex flex-col items-center gap-2 py-2 px-6" style={{ color: '#888888' }}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-sm font-medium">Calls</span>
        </Link>
      </div>

      {/* New Chat Modal */}
      <InputModal
        isOpen={showNewChatModal}
        onClose={() => { setShowNewChatModal(false); setSearchQuery(''); }}
        onConfirm={handleStartDM}
        title="New Chat"
        placeholder="Search for people..."
        confirmText="Start Chat"
      />

      {/* New Group Modal */}
      <InputModal
        isOpen={showNewGroupModal}
        onClose={() => { setShowNewGroupModal(false); setNewGroupName(''); }}
        onConfirm={handleCreateGroup}
        title="New Group"
        placeholder="Group name"
        confirmText="Create"
      />

      {/* Profile Modal */}
      <ActionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Profile"
      >
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#252525' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl" style={{ background: 'linear-gradient(135deg, #00D1FF 0%, #0099CC 100%)' }}>
            {user?.email?.[0].toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{user?.email}</div>
            <div className="text-sm" style={{ color: '#00D1FF' }}>Online</div>
          </div>
        </div>
        <button
          onClick={() => { signOut(); navigate('/login'); }}
          className="w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </ActionModal>
    </div>
  )
}
