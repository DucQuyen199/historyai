const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Debug route để kiểm tra
router.get('/test', (req, res) => {
  res.json({ status: 'OK', message: 'Auth routes working!' });
});

// Public routes - phải đảm bảo các route này đúng
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);

// Thêm route kiểm tra token
router.get('/verify-token', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Token hợp lệ',
    user: req.user
  });
});

module.exports = router; 