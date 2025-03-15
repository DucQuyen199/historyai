const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sql = require('../config/db');
const config = require('../config/db');

// Cấu hình multer cho upload files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'public/uploads/';
    if (file.fieldname === 'images') {
      uploadPath += 'images';
    } else if (file.fieldname === 'video') {
      uploadPath += 'videos';
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
    }
  } else if (file.fieldname === 'video') {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Chỉ chấp nhận file video'), false);
    }
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: file => {
      if (file.fieldname === 'images') return 5 * 1024 * 1024; // 5MB
      return 100 * 1024 * 1024; // 100MB for video
    }
  }
});

// Public routes - Không cần đăng nhập
router.get('/posts', forumController.getPosts);
router.get('/posts/:id', forumController.getPostById);
router.get('/posts/:id/comments', forumController.getPostComments);

// Bài viết theo thời kỳ - chuyển xuống dưới các routes khác
router.get('/posts/period/:period', (req, res) => {
  // Tạm thời trả về mảng rỗng
  res.json({
    success: true,
    posts: []
  });
});

// Protected routes - Yêu cầu đăng nhập
router.use(authMiddleware);

// Bài viết
router.post('/create-post', 
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
  ]),
  forumController.create
);

// Bình luận
router.post('/comments', forumController.addComment);

// Tương tác
router.post('/like', forumController.toggleLike);

// User's content
router.get('/user/posts', forumController.getUserPosts);
router.get('/user/comments', forumController.getUserComments);

// Route kiểm tra bài viết mới nhất
router.get('/latest-posts', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query(`
        SELECT TOP 5 p.*, u.username, u.avatar_url
        FROM forum_posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `);
    
    res.json({
      success: true,
      posts: result.recordset
    });
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách bài viết mới nhất'
    });
  }
});

// Tăng lượt xem
router.post('/posts/:id/view', forumController.incrementViewCount);

// Like/unlike bài viết
router.post('/like', forumController.toggleLike);

// Kiểm tra trạng thái like
router.get('/posts/:id/like-status', forumController.checkLikeStatus);

module.exports = router;