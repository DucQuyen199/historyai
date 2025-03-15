const sql = require('mssql');
const config = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.fieldname === 'images') {
      uploadPath = path.join(__dirname, '../public/uploads/images');
    } else if (file.fieldname === 'video') {
      uploadPath = path.join(__dirname, '../public/uploads/videos');
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
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
    fileSize: (req, file) => {
      if (file.fieldname === 'images') return 5 * 1024 * 1024; // 5MB for images
      return 100 * 1024 * 1024; // 100MB for video
    }
  }
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]);

const forumController = {
  // Public methods - Không cần đăng nhập
  
  // Lấy danh sách bài viết
  getPosts: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT 
          p.*,
          u.username,
          u.avatar_url,
          (SELECT COUNT(*) FROM forum_likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) as comment_count,
          (
            SELECT STRING_AGG(m.file_url, ',')
            FROM forum_media m
            WHERE m.post_id = p.id AND m.media_type = 'image'
          ) as image_urls,
          (
            SELECT TOP 1 m.file_url
            FROM forum_media m
            WHERE m.post_id = p.id AND m.media_type = 'video'
          ) as video_url
        FROM forum_posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `);
      
      // Transform the results to include media arrays
      const posts = result.recordset.map(post => ({
        ...post,
        images: post.image_urls ? post.image_urls.split(',') : [],
        videos: post.video_url || null,
        created_at: new Date(post.created_at).toISOString(),
        updated_at: new Date(post.updated_at).toISOString()
      }));

      res.json({
        success: true,
        posts: posts
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách bài viết'
      });
    }
  },

  // Xem chi tiết bài viết
  getPostById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            p.*,
            u.username,
            u.avatar_url,
            (SELECT COUNT(*) FROM forum_likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) as comment_count
          FROM forum_posts p
          JOIN users u ON p.user_id = u.id
          WHERE p.id = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài viết'
        });
      }

      // Lấy media của bài viết
      const mediaResult = await pool.request()
        .input('post_id', sql.Int, id)
        .query(`
          SELECT media_type, file_url, file_name, file_size, mime_type
          FROM forum_media
          WHERE post_id = @post_id
        `);

      // Xử lý dữ liệu trước khi trả về
      const post = result.recordset[0];
      const media = mediaResult.recordset;

      // Phân loại media
      post.images = media.filter(m => m.media_type === 'image').map(m => m.file_url);
      post.video = media.find(m => m.media_type === 'video')?.file_url || null;

      // Format dates
      post.created_at = new Date(post.created_at).toISOString();
      post.updated_at = new Date(post.updated_at).toISOString();

      res.json({
        success: true,
        post: post
      });

    } catch (error) {
      console.error('Error getting post by id:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy thông tin bài viết'
      });
    }
  },

  // Lấy comments của bài viết
  getPostComments: async (req, res) => {
    try {
      const { id } = req.params;
      
      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('post_id', sql.Int, id)
        .query(`
          SELECT c.*, u.username, u.avatar_url
          FROM forum_comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.post_id = @post_id
          ORDER BY c.created_at ASC
        `);
      
      res.json({
        success: true,
        comments: result.recordset
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách bình luận'
      });
    }
  },

  // Protected methods - Yêu cầu đăng nhập
  
  // Tạo bài viết mới
  create: async (req, res) => {
    let transaction;
    let pool;
    
    try {
      console.log('=== START CREATE POST ===');
      console.log('User:', req.user);
      console.log('Body:', req.body);
      console.log('Files:', req.files);

      if (!req.body.title || !req.body.content) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc (tiêu đề hoặc nội dung)'
        });
      }

      // Tạo pool connection mới
      pool = await sql.connect(config);
      console.log('Database connected');

      // Bắt đầu transaction
      transaction = new sql.Transaction(pool);
      await transaction.begin();
      console.log('Transaction began');

      // Tạo post mới
      const insertValues = {
        title: req.body.title,
        content: req.body.content,
        user_id: req.user.id,
        category: req.body.category || 'general',
        period: req.body.period,
        historical_figure: req.body.historical_figure || null,
        location: req.body.location || null,
        source: req.body.source || null,
        media_count: (req.files?.images?.length || 0) + (req.files?.video?.length || 0),
        has_video: req.files?.video?.length > 0
      };
      console.log('Insert values:', insertValues);

      // Insert post
      const postResult = await transaction.request()
        .input('title', sql.NVarChar, insertValues.title)
        .input('content', sql.NText, insertValues.content)
        .input('user_id', sql.Int, insertValues.user_id)
        .input('category', sql.NVarChar, insertValues.category)
        .input('status', sql.NVarChar, 'active')
        .input('period', sql.NVarChar, insertValues.period)
        .input('historical_figure', sql.NVarChar, insertValues.historical_figure)
        .input('location', sql.NVarChar, insertValues.location)
        .input('source', sql.NVarChar, insertValues.source)
        .input('media_count', sql.Int, insertValues.media_count)
        .input('has_video', sql.Bit, insertValues.has_video)
        .query(`
          INSERT INTO forum_posts (
            title, content, user_id, category, status,
            period, historical_figure, location, source,
            media_count, has_video
          )
          OUTPUT INSERTED.*
          VALUES (
            @title, @content, @user_id, @category, @status,
            @period, @historical_figure, @location, @source,
            @media_count, @has_video
          )
        `);

      const post = postResult.recordset[0];
      console.log('Post inserted:', post);

      // Xử lý media files
      if (req.files) {
        if (req.files.images) {
          for (const image of req.files.images) {
            const fileUrl = `/uploads/images/${image.filename}`;
            await transaction.request()
              .input('post_id', sql.Int, post.id)
              .input('media_type', sql.NVarChar, 'image')
              .input('file_url', sql.NVarChar, fileUrl)
              .input('file_name', sql.NVarChar, image.originalname)
              .input('file_size', sql.Int, image.size)
              .input('mime_type', sql.NVarChar, image.mimetype)
              .query(`
                INSERT INTO forum_media (
                  post_id, media_type, file_url, 
                  file_name, file_size, mime_type
                )
                VALUES (
                  @post_id, @media_type, @file_url, 
                  @file_name, @file_size, @mime_type
                )
              `);
          }
        }

        if (req.files.video && req.files.video[0]) {
          const video = req.files.video[0];
          const fileUrl = `/public/uploads/videos/${video.filename}`;
          await transaction.request()
            .input('post_id', sql.Int, post.id)
            .input('media_type', sql.NVarChar, 'video')
            .input('file_url', sql.NVarChar, fileUrl)
            .input('file_name', sql.NVarChar, video.originalname)
            .input('file_size', sql.Int, video.size)
            .input('mime_type', sql.NVarChar, video.mimetype)
            .query(`
              INSERT INTO forum_media (
                post_id, media_type, file_url, 
                file_name, file_size, mime_type
              )
              VALUES (
                @post_id, @media_type, @file_url, 
                @file_name, @file_size, @mime_type
              )
            `);
        }
      }

      // Commit transaction
      await transaction.commit();
      console.log('Transaction committed');

      res.json({
        success: true,
        message: 'Tạo bài viết thành công',
        post: post
      });

    } catch (error) {
      console.error('Create post error:', error);
      
      if (transaction) {
        try {
          await transaction.rollback();
          console.log('Transaction rolled back');
        } catch (rollbackError) {
          console.error('Rollback error:', rollbackError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Không thể tạo bài viết'
      });
    } finally {
      if (pool) {
        try {
          await pool.close();
          console.log('Pool closed');
        } catch (closeError) {
          console.error('Error closing pool:', closeError);
        }
      }
    }
  },

  // Thêm bình luận
  addComment: async (req, res) => {
    try {
      const { post_id, content } = req.body;
      const user_id = req.user.id;
      
      if (!post_id || !content) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bài viết hoặc nội dung bình luận'
        });
      }
      
      const pool = await sql.connect(config);
      
      // Kiểm tra bài viết có tồn tại không
      const postCheck = await pool.request()
        .input('post_id', sql.Int, post_id)
        .query('SELECT id FROM forum_posts WHERE id = @post_id');
      
      if (postCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bài viết không tồn tại'
        });
      }
      
      // Thêm bình luận
      const result = await pool.request()
        .input('post_id', sql.Int, post_id)
        .input('user_id', sql.Int, user_id)
        .input('content', sql.NVarChar, content)
        .query(`
          INSERT INTO forum_comments (post_id, user_id, content)
          OUTPUT INSERTED.*
          VALUES (@post_id, @user_id, @content)
        `);
      
      // Lấy thông tin user để trả về
      const userInfo = await pool.request()
        .input('user_id', sql.Int, user_id)
        .query('SELECT username, avatar_url FROM users WHERE id = @user_id');
      
      const comment = result.recordset[0];
      comment.username = userInfo.recordset[0].username;
      comment.avatar_url = userInfo.recordset[0].avatar_url;
      
      return res.status(201).json({
        success: true,
        message: 'Đã thêm bình luận',
        comment
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể thêm bình luận'
      });
    }
  },

  // Like/unlike bài viết
  likePost: async (req, res) => {
    try {
      const { post_id } = req.body;
      const user_id = req.user.id;
      
      if (!post_id) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bài viết'
        });
      }
      
      const pool = await sql.connect(config);
      
      // Kiểm tra bài viết có tồn tại không
      const postCheck = await pool.request()
        .input('post_id', sql.Int, post_id)
        .query('SELECT id FROM forum_posts WHERE id = @post_id');
      
      if (postCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bài viết không tồn tại'
        });
      }
      
      // Kiểm tra đã like chưa
      const likeCheck = await pool.request()
        .input('post_id', sql.Int, post_id)
        .input('user_id', sql.Int, user_id)
        .query('SELECT id FROM forum_likes WHERE post_id = @post_id AND user_id = @user_id');
      
      if (likeCheck.recordset.length > 0) {
        // Đã like rồi thì unlike
        await pool.request()
          .input('post_id', sql.Int, post_id)
          .input('user_id', sql.Int, user_id)
          .query('DELETE FROM forum_likes WHERE post_id = @post_id AND user_id = @user_id');
        
        return res.json({
          success: true,
          liked: false,
          message: 'Đã bỏ thích bài viết'
        });
      } else {
        // Chưa like thì thêm like
        await pool.request()
          .input('post_id', sql.Int, post_id)
          .input('user_id', sql.Int, user_id)
          .query('INSERT INTO forum_likes (post_id, user_id) VALUES (@post_id, @user_id)');
        
        return res.json({
          success: true,
          liked: true,
          message: 'Đã thích bài viết'
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể thực hiện thao tác like'
      });
    }
  },

  // Lấy bài viết của người dùng hiện tại
  getUserPosts: async (req, res) => {
    try {
      const user_id = req.user.id;
      
      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('user_id', sql.Int, user_id)
        .query(`
          SELECT p.*, 
            (SELECT COUNT(*) FROM forum_likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) as comment_count
          FROM forum_posts p
          WHERE p.user_id = @user_id
          ORDER BY p.created_at DESC
        `);
      
      res.json({
        success: true,
        posts: result.recordset
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách bài viết của bạn'
      });
    }
  },
  
  // Lấy bình luận của người dùng hiện tại
  getUserComments: async (req, res) => {
    try {
      const user_id = req.user.id;
      
      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('user_id', sql.Int, user_id)
        .query(`
          SELECT c.*, p.title as post_title, p.id as post_id
          FROM forum_comments c
          JOIN forum_posts p ON c.post_id = p.id
          WHERE c.user_id = @user_id
          ORDER BY c.created_at DESC
        `);
      
      res.json({
        success: true,
        comments: result.recordset
      });
    } catch (error) {
      console.error('Error fetching user comments:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách bình luận của bạn'
      });
    }
  },

  createPost: (req, res) => {
    // Stub implementation for creating a post
    res.json({ success: true, message: "Post created successfully" });
  },

  // Thêm phương thức đếm lượt xem
  incrementViewCount: async (req, res) => {
    try {
      const { id } = req.params;
      const sessionId = req.sessionID || req.ip; // Sử dụng session ID hoặc IP làm định danh
      
      const pool = await sql.connect(config);
      
      // Kiểm tra xem đã xem trong phiên này chưa
      const viewCheck = await pool.request()
        .input('post_id', sql.Int, id)
        .input('session_id', sql.NVarChar, sessionId)
        .query(`
          SELECT id FROM post_views 
          WHERE post_id = @post_id 
          AND session_id = @session_id 
          AND viewed_at > DATEADD(hour, -1, GETDATE())
        `);

      if (viewCheck.recordset.length === 0) {
        // Nếu chưa xem trong 1 giờ qua, tăng lượt xem
        await pool.request()
          .input('post_id', sql.Int, id)
          .input('session_id', sql.NVarChar, sessionId)
          .query(`
            BEGIN TRANSACTION;
            
            UPDATE forum_posts 
            SET view_count = view_count + 1 
            WHERE id = @post_id;

            INSERT INTO post_views (post_id, session_id)
            VALUES (@post_id, @session_id);
            
            COMMIT;
          `);
      }

      // Lấy số lượt xem hiện tại
      const viewCount = await pool.request()
        .input('post_id', sql.Int, id)
        .query(`
          SELECT view_count 
          FROM forum_posts 
          WHERE id = @post_id
        `);

      res.json({ 
        success: true,
        viewCount: viewCount.recordset[0].view_count
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể cập nhật lượt xem'
      });
    }
  },

  // Thêm/xóa like
  toggleLike: async (req, res) => {
    try {
      const { post_id } = req.body;
      const user_id = req.user.id;

      const pool = await sql.connect(config);
      
      // Kiểm tra xem đã like chưa
      const checkResult = await pool.request()
        .input('post_id', sql.Int, post_id)
        .input('user_id', sql.Int, user_id)
        .query(`
          SELECT id FROM forum_likes 
          WHERE post_id = @post_id AND user_id = @user_id
        `);

      if (checkResult.recordset.length > 0) {
        // Nếu đã like thì xóa
        await pool.request()
          .input('post_id', sql.Int, post_id)
          .input('user_id', sql.Int, user_id)
          .query(`
            DELETE FROM forum_likes 
            WHERE post_id = @post_id AND user_id = @user_id
          `);
      } else {
        // Nếu chưa like thì thêm
        await pool.request()
          .input('post_id', sql.Int, post_id)
          .input('user_id', sql.Int, user_id)
          .query(`
            INSERT INTO forum_likes (post_id, user_id)
            VALUES (@post_id, @user_id)
          `);
      }

      // Lấy số lượng like mới
      const likeCount = await pool.request()
        .input('post_id', sql.Int, post_id)
        .query(`
          SELECT COUNT(*) as count 
          FROM forum_likes 
          WHERE post_id = @post_id
        `);

      res.json({
        success: true,
        liked: checkResult.recordset.length === 0,
        likeCount: likeCount.recordset[0].count
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể thực hiện thao tác'
      });
    }
  },

  // Kiểm tra trạng thái like
  checkLikeStatus: async (req, res) => {
    try {
      const { post_id } = req.params;
      const user_id = req.user.id;

      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('post_id', sql.Int, post_id)
        .input('user_id', sql.Int, user_id)
        .query(`
          SELECT id FROM forum_likes 
          WHERE post_id = @post_id AND user_id = @user_id
        `);

      res.json({
        success: true,
        liked: result.recordset.length > 0
      });
    } catch (error) {
      console.error('Error checking like status:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể kiểm tra trạng thái'
      });
    }
  }
};

module.exports = forumController;