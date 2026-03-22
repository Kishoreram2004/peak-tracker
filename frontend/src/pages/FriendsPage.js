import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useSocket } from '../context/SocketContext';
import MountainClimber from '../components/MountainClimber';
import StarRating from '../components/StarRating';

const FriendsPage = () => {
  const { on, off } = useSocket();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendSession, setFriendSession] = useState(null);
  const [friendHistory, setFriendHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('friends'); // friends, search, requests
  const [searchLoading, setSearchLoading] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadData();

    const handleFriendRequest = ({ from }) => {
      showNotification(`📬 ${from.username} sent you a friend request!`);
      loadData();
    };
    const handleRequestAccepted = ({ by }) => {
      showNotification(`🎉 ${by.username} accepted your friend request!`);
      loadData();
    };
    const handleFriendUpdate = ({ userId }) => {
      if (selectedFriend?._id === userId) {
        loadFriendSession(selectedFriend);
      }
    };

    on('friend_request', handleFriendRequest);
    on('friend_request_accepted', handleRequestAccepted);
    on('friend_session_updated', handleFriendUpdate);

    return () => {
      off('friend_request', handleFriendRequest);
      off('friend_request_accepted', handleRequestAccepted);
      off('friend_session_updated', handleFriendUpdate);
    };
  }, [selectedFriend]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.getFriends(),
        api.getPendingRequests()
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const { data } = await api.searchUsers(q);
      setSearchResults(data);
    } catch {}
    setSearchLoading(false);
  };

  const sendRequest = async (userId) => {
    try {
      await api.sendFriendRequest(userId);
      showNotification('✅ Friend request sent!');
      setSearchResults(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      showNotification('❌ ' + (err.response?.data?.message || 'Error'));
    }
  };

  const respondRequest = async (requesterId, action) => {
    try {
      await api.respondToRequest(requesterId, action);
      showNotification(action === 'accept' ? '🤝 Friend added!' : 'Request declined');
      loadData();
    } catch (err) {
      showNotification('❌ Error');
    }
  };

  const loadFriendSession = async (friend) => {
    setSelectedFriend(friend);
    setFriendSession(null);
    setFriendHistory([]);
    try {
      const [sessionRes, historyRes] = await Promise.all([
        api.getFriendTodaySession(friend._id),
        api.getFriendHistory(friend._id)
      ]);
      setFriendSession(sessionRes.data);
      setFriendHistory(historyRes.data);
    } catch {}
  };

  const CLIMBER_COLORS = ['#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#34d399'];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Notification toast */}
      {notification && (
        <div style={{
          position: 'fixed', top: '80px', right: '20px', zIndex: 1000,
          background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(74,222,128,0.4)',
          borderRadius: '12px', padding: '12px 20px', color: '#e2e8f0',
          fontSize: '14px', fontWeight: '600',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'slideIn 0.3s ease'
        }}>
          {notification}
        </div>
      )}

      <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
        Friends
      </h1>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
        Connect and climb together
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[
          { id: 'friends', label: `👥 Friends (${friends.length})` },
          { id: 'search', label: '🔍 Find People' },
          { id: 'requests', label: `📬 Requests ${requests.length > 0 ? `(${requests.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: '9px', border: 'none',
            background: tab === t.id ? 'rgba(74,222,128,0.15)' : 'transparent',
            color: tab === t.id ? '#4ade80' : '#64748b',
            fontWeight: tab === t.id ? '700' : '400',
            cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left panel */}
        <div style={{ flex: '0 0 320px' }}>
          {/* SEARCH TAB */}
          {tab === 'search' && (
            <div>
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={handleSearch}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px', color: '#e2e8f0',
                  fontSize: '14px', outline: 'none', marginBottom: '12px',
                  boxSizing: 'border-box'
                }}
              />
              {searchLoading && <div style={{ color: '#64748b', fontSize: '13px', padding: '8px' }}>Searching...</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.map(u => (
                  <div key={u._id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: 'rgba(96,165,250,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px'
                    }}>🧗</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>{u.username}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{u.totalPoints || 0} pts</div>
                    </div>
                    <button
                      onClick={() => sendRequest(u._id)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none',
                        background: 'rgba(74,222,128,0.15)', color: '#4ade80',
                        cursor: 'pointer', fontSize: '12px', fontWeight: '700'
                      }}
                    >
                      + Add
                    </button>
                  </div>
                ))}
                {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                  <div style={{ color: '#475569', fontSize: '13px', padding: '8px' }}>No users found</div>
                )}
              </div>
            </div>
          )}

          {/* REQUESTS TAB */}
          {tab === 'requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {requests.length === 0 && (
                <div style={{ color: '#475569', fontSize: '13px', padding: '8px' }}>No pending requests</div>
              )}
              {requests.map(req => (
                <div key={req._id} style={{
                  padding: '14px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: 'rgba(167,139,250,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                    }}>🧗</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>{req.from.username}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{req.from.totalPoints || 0} pts all-time</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => respondRequest(req.from._id, 'accept')} style={{
                      flex: 1, padding: '7px', borderRadius: '8px', border: 'none',
                      background: 'rgba(74,222,128,0.15)', color: '#4ade80',
                      cursor: 'pointer', fontSize: '12px', fontWeight: '700'
                    }}>✓ Accept</button>
                    <button onClick={() => respondRequest(req.from._id, 'reject')} style={{
                      flex: 1, padding: '7px', borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: '#94a3b8',
                      cursor: 'pointer', fontSize: '12px'
                    }}>✕ Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FRIENDS TAB */}
          {tab === 'friends' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loading && <div style={{ color: '#64748b', fontSize: '13px' }}>Loading friends...</div>}
              {!loading && friends.length === 0 && (
                <div style={{
                  padding: '24px', borderRadius: '12px', textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.1)', color: '#475569'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏔️</div>
                  <div style={{ fontSize: '13px' }}>No friends yet.<br />Search for climbers to connect!</div>
                  <button onClick={() => setTab('search')} style={{
                    marginTop: '12px', padding: '7px 18px', borderRadius: '8px', border: 'none',
                    background: 'rgba(74,222,128,0.15)', color: '#4ade80',
                    cursor: 'pointer', fontSize: '12px', fontWeight: '700'
                  }}>Find Friends</button>
                </div>
              )}
              {friends.map((friend, i) => (
                <div
                  key={friend._id}
                  onClick={() => loadFriendSession(friend)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                    background: selectedFriend?._id === friend._id
                      ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedFriend?._id === friend._id
                      ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: `${CLIMBER_COLORS[i % CLIMBER_COLORS.length]}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                  }}>🧗</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>{friend.username}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{friend.totalPoints || 0} pts total</div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#475569' }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel: friend's session */}
        {selectedFriend && (
          <div style={{ flex: 1 }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: '16px', padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '32px' }}>🧗</div>
                <div>
                  <h2 style={{ color: '#60a5fa', margin: 0, fontSize: '20px', fontWeight: '800' }}>
                    {selectedFriend.username}
                  </h2>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>
                    {selectedFriend.totalPoints || 0} pts all-time
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <MountainClimber
                    points={friendSession?.totalPoints || 0}
                    maxPoints={1200}
                    username={selectedFriend.username}
                    color="#60a5fa"
                    size="small"
                  />
                </div>
              </div>

              {/* Today's session */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  Today's Progress
                </div>
                {friendSession ? (
                  <>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#60a5fa', fontFamily: 'monospace' }}>{friendSession.totalPoints}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Points</div>
                      </div>
                      <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#4ade80', fontFamily: 'monospace' }}>{friendSession.hoursCompleted}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Hours Done</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {friendSession.hourBlocks.filter(b => b.completed).map(b => (
                        <div key={b.hourIndex} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 12px', borderRadius: '10px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)'
                        }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', minWidth: '55px' }}>
                            {b.startTime}
                          </span>
                          <span style={{ flex: 1, fontSize: '12px', color: '#e2e8f0' }}>
                            {b.activity || 'Unlabeled'}
                          </span>
                          <StarRating rating={b.rating} readonly size={12} />
                          <span style={{ fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace' }}>
                            +{b.rating * 10}
                          </span>
                        </div>
                      ))}
                      {friendSession.hourBlocks.filter(b => b.completed).length === 0 && (
                        <div style={{ color: '#475569', fontSize: '13px', padding: '8px' }}>
                          No completed hours yet today
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#475569', fontSize: '13px', padding: '8px' }}>
                    No activity recorded today
                  </div>
                )}
              </div>

              {/* History summary */}
              {friendHistory.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Recent History
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {friendHistory.slice(0, 10).map(s => (
                      <div key={s.date} style={{
                        padding: '6px 10px', borderRadius: '8px',
                        background: 'rgba(96,165,250,0.08)',
                        border: '1px solid rgba(96,165,250,0.15)',
                        fontSize: '11px', textAlign: 'center'
                      }}>
                        <div style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                          {new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ color: '#60a5fa', fontWeight: '700' }}>{s.totalPoints}pts</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state if no friend selected */}
        {!selectedFriend && tab === 'friends' && friends.length > 0 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px',
            padding: '40px', color: '#475569', textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>👈</div>
              <div style={{ fontSize: '14px' }}>Select a friend to see their mountain progress</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
