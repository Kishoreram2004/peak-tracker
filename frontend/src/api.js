import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
  // Sessions
  getTodaySession: () => axios.get(`${BASE}/sessions/today`),
  updateHourBlock: (hourIndex, data) => axios.put(`${BASE}/sessions/today/hour/${hourIndex}`, data),
  getSessionHistory: () => axios.get(`${BASE}/sessions/history`),
  getSessionByDate: (date) => axios.get(`${BASE}/sessions/date/${date}`),
  getFriendTodaySession: (friendId) => axios.get(`${BASE}/sessions/friend/${friendId}/today`),
  getFriendHistory: (friendId) => axios.get(`${BASE}/sessions/friend/${friendId}/history`),

  // Friends
  searchUsers: (q) => axios.get(`${BASE}/friends/search?q=${q}`),
  sendFriendRequest: (userId) => axios.post(`${BASE}/friends/request/${userId}`),
  respondToRequest: (requesterId, action) =>
    axios.put(`${BASE}/friends/request/${requesterId}/respond`, { action }),
  getPendingRequests: () => axios.get(`${BASE}/friends/requests`),
  getFriends: () => axios.get(`${BASE}/friends`),

  // Auth
  getProfile: () => axios.get(`${BASE}/auth/profile`)
};
