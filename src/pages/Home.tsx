import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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
  const [showNewGroupModal, setShowNewGroupModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    
    const { data: profilesData } = await supabase.from('profiles').select('*')
    if (profilesData) setProfiles(profilesData.filter(p => p.id !== user.id))

    const { data: friendsData } = await supabase
      .from('friends')
      .select('friend_id, profiles(*)')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
    if (friendsData) setFriends(friendsData.map(f => f.profiles as Profile))

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

    const { data: groupData } = await supabase
      .from('group_members')
      .select('group_id, group_chats(*)')
      .eq('user_id', user.id)
    if (groupData) setGroups(groupData.map(g => g.group_chats as GroupChat))
  }

  const handleStartDM = (profileId: string) => {
    navigate(`/dm/${profileId}`)
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
    <div className="flex-1 flex flex-col h-full" style={{ background: '#050505' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between" style={{ background: 'rgba(15,15,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #27272a' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
          >
            {user?.email?.[0].toUpperCase()}
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Messages</h1>
            <p className="text-xs" style={{ color: '#71717a' }}>Stay connected</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNewGroupModal(true)}
            className="p-3 rounded-xl transition-all hover:scale-105"
            style={{ background: '#1a1a1a', color: '#fafafa' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-indigo-500/50" style={{ background: '#1a1a1a', border: '1px solid #27272a' }}>
          <svg className="w-5 h-5" style={{ color: '#71717a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-sm font-medium"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-4">
        {searchQuery ? (
          <div className="space-y-1">
            <p className="text-xs font-medium px-3 py-2" style={{ color: '#71717a' }}>PEOPLE</p>
            {filteredProfiles.map(profile => (
              <div
                key={profile.id}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all cursor-pointer hover:scale-[1.01]"
                style={{ background: '#1a1a1a' }}
                onClick={() => handleStartDM(profile.id)}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0" style={{ background: '#27272a' }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {profile.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  {profile.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: '#050505', background: '#6366f1' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white truncate">{profile.username}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddFriend(profile.id); }}
                      className="p-2 rounded-xl transition-all hover:scale-110"
                      style={{ background: '#27272a', color: '#6366f1' }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                  </div>
                  {profile.description && (
                    <p className="text-xs truncate mt-0.5" style={{ color: '#71717a' }}>{profile.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Groups */}
            {groups.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium px-3 py-2" style={{ color: '#71717a' }}>GROUPS</p>
                <div className="space-y-2">
                  {groups.map(group => (
                    <Link
                      key={group.id}
                      to={`/group/${group.id}`}
                      className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all hover:scale-[1.01]"
                      style={{ background: '#1a1a1a' }}
                    >
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                        {group.avatar_url ? (
                          <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-lg">{group.name[0].toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-medium text-white">{group.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Friends */}
            {friends.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium px-3 py-2" style={{ color: '#71717a' }}>FRIENDS</p>
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all cursor-pointer hover:scale-[1.01]"
                      style={{ background: '#1a1a1a' }}
                      onClick={() => handleStartDM(friend.id)}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0" style={{ background: '#27272a' }}>
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                              {friend.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        {friend.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: '#050505', background: '#6366f1' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-white block truncate">{friend.username}</span>
                        {friend.description && (
                          <p className="text-xs truncate mt-0.5" style={{ color: '#71717a' }}>{friend.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DMs */}
            {dms.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium px-3 py-2" style={{ color: '#71717a' }}>MESSAGES</p>
                <div className="space-y-2">
                  {dms.map(dm => (
                    <div
                      key={dm.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all cursor-pointer hover:scale-[1.01]"
                      style={{ background: '#1a1a1a' }}
                      onClick={() => dm.receiver && navigate(`/dm/${dm.receiver.id}`)}
                    >
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0" style={{ background: '#27272a' }}>
                        {dm.receiver?.avatar_url ? (
                          <img src={dm.receiver.avatar_url} alt={dm.receiver.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold">
                            {dm.receiver?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white truncate">{dm.receiver?.username}</span>
                          <span className="text-xs" style={{ color: '#71717a' }}>{new Date(dm.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: '#71717a' }}>{dm.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {groups.length === 0 && friends.length === 0 && dms.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-24 h-24 rounded-3xl mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 8px 40px rgba(99,102,241,0.3)' }}>
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
                <p className="text-sm max-w-xs" style={{ color: '#71717a' }}>Search for people above to start chatting</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="relative z-10 h-20 flex items-center justify-around" style={{ background: 'rgba(15,15,15,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid #27272a' }}>
        <Link to="/home" className="flex flex-col items-center gap-1.5 py-2 px-6 rounded-xl transition-all" style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-medium">Chats</span>
        </Link>
        <Link to="/status" className="flex flex-col items-center gap-1.5 py-2 px-6 rounded-xl transition-all" style={{ color: '#71717a' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">Status</span>
        </Link>
        <Link to="/calls" className="flex flex-col items-center gap-1.5 py-2 px-6 rounded-xl transition-all" style={{ color: '#71717a' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-xs font-medium">Calls</span>
        </Link>
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#1a1a1a', border: '1px solid #27272a' }}>
            <h3 className="text-xl font-bold text-white mb-5">Create Group</h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full px-4 py-3.5 rounded-2xl bg-transparent text-white placeholder-zinc-500 outline-none text-sm font-medium mb-5"
              style={{ background: '#27272a', border: '1px solid #3f3f46' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="flex-1 py-3.5 rounded-2xl font-medium transition-all"
                style={{ background: '#27272a', color: '#a1a1aa' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="flex-1 py-3.5 rounded-2xl font-medium transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#1a1a1a', border: '1px solid #27272a' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
                {user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <div className="text-lg font-semibold text-white">{user?.email?.split('@')[0]}</div>
                <div className="text-xs flex items-center gap-1.5" style={{ color: '#6366f1' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />
                  Online
                </div>
              </div>
            </div>
            <button
              onClick={() => { signOut(); navigate('/login'); }}
              className="w-full py-3.5 px-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-2"
              style={{ background: '#27272a', color: '#f87171' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full mt-3 py-3.5 px-4 rounded-2xl font-medium transition-all"
              style={{ background: 'transparent', color: '#71717a' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
