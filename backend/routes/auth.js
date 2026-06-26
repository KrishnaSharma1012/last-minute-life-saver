const express = require('express');
const router = express.Router();

// Placeholder auth routes — will integrate Firebase Auth later
router.post('/google', (req, res) => {
  // For now, return a mock user
  res.json({
    user: {
      uid: 'demo-user-001',
      displayName: 'Krishna Sharma',
      email: 'krishna@example.com',
      photoURL: null,
      streakDays: 12,
      productivityScore: 87,
    },
    token: 'demo-jwt-token',
  });
});

router.get('/me', (req, res) => {
  res.json({
    user: {
      uid: 'demo-user-001',
      displayName: 'Krishna Sharma',
      email: 'krishna@example.com',
      streakDays: 12,
      productivityScore: 87,
    },
  });
});

module.exports = router;
