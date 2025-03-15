const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const sql = require('mssql');
const config = require('../config/db');

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/chat');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
router.post('/', authMiddleware, upload.single('image'), chatController.handleChat);

// Thêm route lấy lịch sử chat
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query(`
        SELECT id, question, answer, created_at
        FROM chat_history
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    res.json({
      success: true,
      history: result.recordset
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử chat'
    });
  }
});

module.exports = router; 