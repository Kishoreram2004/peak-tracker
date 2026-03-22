const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get or create today's session
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let session = await Session.findOne({ user: req.user._id, date: today });

    if (!session) {
      // Create default 24 hour blocks
      const hourBlocks = Array.from({ length: 24 }, (_, i) => ({
        hourIndex: i,
        startTime: `${String(i).padStart(2, '0')}:00`,
        endTime: `${String(i + 1 > 23 ? 0 : i + 1).padStart(2, '0')}:00`,
        activity: '',
        rating: 0,
        completed: false,
        notes: '',
        timerPhase: 'idle'
      }));

      session = await Session.create({
        user: req.user._id,
        date: today,
        hourBlocks
      });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get session by date
router.get('/date/:date', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ user: req.user._id, date: req.params.date });
    if (!session) return res.status(404).json({ message: 'No session for this date' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an hour block
router.put('/today/hour/:hourIndex', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { hourIndex } = req.params;
    const updates = req.body;

    let session = await Session.findOne({ user: req.user._id, date: today });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const blockIndex = session.hourBlocks.findIndex(b => b.hourIndex === parseInt(hourIndex));
    if (blockIndex === -1) return res.status(404).json({ message: 'Hour block not found' });

    // Apply updates
    Object.keys(updates).forEach(key => {
      session.hourBlocks[blockIndex][key] = updates[key];
    });

    // Recalculate totals
    session.calculatePoints();

    await session.save();

    // Update user's total points
    const allSessions = await Session.find({ user: req.user._id });
    const totalPoints = allSessions.reduce((sum, s) => sum + s.totalPoints, 0);
    await User.findByIdAndUpdate(req.user._id, { totalPoints });

    // Notify friends via socket
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const user = await User.findById(req.user._id).populate('friends', '_id');

    if (user.friends && io) {
      user.friends.forEach(friend => {
        const friendSocketId = connectedUsers[friend._id.toString()];
        if (friendSocketId) {
          io.to(friendSocketId).emit('friend_session_updated', {
            userId: req.user._id.toString()
          });
        }
      });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get session history (last 7 days)
router.get('/history', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(30);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get friend's today session
router.get('/friend/:friendId/today', protect, async (req, res) => {
  try {
    // Verify they are friends
    const user = await User.findById(req.user._id);
    const isFriend = user.friends.includes(req.params.friendId);
    if (!isFriend) return res.status(403).json({ message: 'Not friends with this user' });

    const today = new Date().toISOString().split('T')[0];
    const session = await Session.findOne({ user: req.params.friendId, date: today })
      .populate('user', 'username totalPoints');

    res.json(session || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get friend's session history
router.get('/friend/:friendId/history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isFriend = user.friends.includes(req.params.friendId);
    if (!isFriend) return res.status(403).json({ message: 'Not friends with this user' });

    const sessions = await Session.find({ user: req.params.friendId })
      .sort({ date: -1 })
      .limit(30)
      .populate('user', 'username totalPoints');

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
