const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Search users
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { $or: [
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]}
      ]
    }).select('username email totalPoints').limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send friend request
router.post('/request/:userId', protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Check if already friends
    if (targetUser.friends.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = targetUser.friendRequests.find(
      r => r.from.toString() === req.user._id.toString() && r.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    targetUser.friendRequests.push({ from: req.user._id, status: 'pending' });
    await targetUser.save();

    // Notify via socket
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const targetSocketId = connectedUsers[req.params.userId];
    if (targetSocketId && io) {
      io.to(targetSocketId).emit('friend_request', {
        from: { _id: req.user._id, username: req.user.username }
      });
    }

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept/reject friend request
router.put('/request/:requesterId/respond', protect, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const user = await User.findById(req.user._id);

    const requestIndex = user.friendRequests.findIndex(
      r => r.from.toString() === req.params.requesterId && r.status === 'pending'
    );

    if (requestIndex === -1) return res.status(404).json({ message: 'Request not found' });

    if (action === 'accept') {
      user.friendRequests[requestIndex].status = 'accepted';
      user.friends.push(req.params.requesterId);
      await user.save();

      // Add reverse friendship
      await User.findByIdAndUpdate(req.params.requesterId, {
        $push: { friends: req.user._id }
      });

      // Notify requester
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      const requesterSocketId = connectedUsers[req.params.requesterId];
      if (requesterSocketId && io) {
        io.to(requesterSocketId).emit('friend_request_accepted', {
          by: { _id: req.user._id, username: req.user.username }
        });
      }
    } else {
      user.friendRequests[requestIndex].status = 'rejected';
      await user.save();
    }

    res.json({ message: `Request ${action}ed` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending friend requests
router.get('/requests', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.from', 'username email totalPoints');
    const pending = user.friendRequests.filter(r => r.status === 'pending');
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get friends list
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email totalPoints');
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
