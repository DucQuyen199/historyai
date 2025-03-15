const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const forumRoutes = require('./routes/forumRoutes');
const authRoutes = require('./routes/authRoutes');
const { setupDirectories } = require('./setup');
const debugRoutes = require('./routes/debugRoutes');
const errorHandler = require('./middleware/errorHandler');
const multer = require('multer');
const bodyParser = require('body-parser');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Thêm logging chi tiết hơn
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Routes
app.use('/api/forum', forumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);

// Kiểm tra kết nối đến server
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Add MIME types for video files
app.use((req, res, next) => {
  if (req.url.startsWith('/public/uploads/videos/')) {
    const ext = path.extname(req.url).toLowerCase();
    switch (ext) {
      case '.mp4':
        res.setHeader('Content-Type', 'video/mp4');
        break;
      case '.webm':
        res.setHeader('Content-Type', 'video/webm');
        break;
      case '.ogg':
        res.setHeader('Content-Type', 'video/ogg');
        break;
    }
  }
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.use(errorHandler);

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // Limit file size to 100MB
});

// Remove these incorrect lines
// app.use('/api/forum/create-post', upload.fields([{ name: 'images', maxCount: 5 }, { name: 'video', maxCount: 1 }]));
// app.post('/api/forum/create-post', forumRoutes);

// Routes with middleware should be defined in forumRoutes.js instead
app.use('/api/forum', forumRoutes);

const PORT = process.env.PORT || 5001;

// Sửa phần khởi động server
const startServer = async () => {
  try {
    // Chạy setup trước khi khởi động server
    await setupDirectories();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api/`);
      console.log(`Auth routes at http://localhost:${PORT}/api/auth/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

module.exports = app;