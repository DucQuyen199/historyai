CREATE DATABASE history_db;
GO

USE history_db;
GO

CREATE TABLE historical_events (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
    description NTEXT,
    date DATE,
    location NVARCHAR(255),
    period NVARCHAR(100),
    image_url NVARCHAR(500),
    thumbnail_url NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE historical_figures (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    birth_date DATE,
    death_date DATE,
    biography NTEXT,
    portrait_url NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE event_figure_relations (
    id INT PRIMARY KEY IDENTITY(1,1),
    event_id INT,
    figure_id INT,
    relationship_type NVARCHAR(100),
    FOREIGN KEY (event_id) REFERENCES historical_events(id),
    FOREIGN KEY (figure_id) REFERENCES historical_figures(id)
);
GO

CREATE TABLE historical_images (
    id INT PRIMARY KEY IDENTITY(1,1),
    image_url NVARCHAR(500) NOT NULL,
    caption NVARCHAR(500),
    source NVARCHAR(255),
    event_id INT,
    figure_id INT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (event_id) REFERENCES historical_events(id),
    FOREIGN KEY (figure_id) REFERENCES historical_figures(id)
);
GO

-- Kiểm tra và tạo bảng users nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id INT PRIMARY KEY IDENTITY(1,1),
        username NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        avatar_url NVARCHAR(500),
        role NVARCHAR(20) DEFAULT 'user',
        bio NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Bảng forum_posts để lưu các bài đăng
CREATE TABLE forum_posts (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(255) NOT NULL,
    content NTEXT NOT NULL,
    user_id INT NOT NULL,
    category NVARCHAR(50) NOT NULL,
    status NVARCHAR(20) DEFAULT 'active',
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    is_pinned BIT DEFAULT 0,
    period NVARCHAR(100),
    historical_figure NVARCHAR(255),
    location NVARCHAR(255),
    source NVARCHAR(500),
    image_url NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    media_count INT DEFAULT 0, -- Số lượng media (ảnh + video)
    has_video BIT DEFAULT 0   -- Đánh dấu bài viết có video hay không
);
GO

-- Bảng forum_comments để lưu các bình luận
CREATE TABLE forum_comments (
    id INT PRIMARY KEY IDENTITY(1,1),
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content NTEXT NOT NULL,
    parent_id INT,
    like_count INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES forum_comments(id)
);
GO

-- Bảng forum_likes để lưu lượt thích cho bài đăng và bình luận
CREATE TABLE forum_likes (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    post_id INT,
    comment_id INT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
    FOREIGN KEY (comment_id) REFERENCES forum_comments(id),
    -- Đảm bảo user chỉ có thể like một lần
    CONSTRAINT UC_Like UNIQUE (user_id, post_id, comment_id)
);
GO

-- Bảng forum_tags để lưu các thẻ
CREATE TABLE forum_tags (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Bảng trung gian để liên kết posts và tags
CREATE TABLE forum_post_tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
    FOREIGN KEY (tag_id) REFERENCES forum_tags(id),
    PRIMARY KEY (post_id, tag_id)
);
GO

-- Bảng để lưu các file đính kèm trong bài đăng
CREATE TABLE forum_attachments (
    id INT PRIMARY KEY IDENTITY(1,1),
    post_id INT NOT NULL,
    file_url NVARCHAR(500) NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_type NVARCHAR(50),
    file_size INT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (post_id) REFERENCES forum_posts(id)
);
GO

-- Bảng để theo dõi báo cáo vi phạm
CREATE TABLE forum_reports (
    id INT PRIMARY KEY IDENTITY(1,1),
    reporter_id INT NOT NULL,
    post_id INT,
    comment_id INT,
    reason NVARCHAR(255) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    handled_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
    FOREIGN KEY (comment_id) REFERENCES forum_comments(id),
    FOREIGN KEY (handled_by) REFERENCES users(id)
);
GO

-- Thêm bảng lưu trữ media (ảnh và video) của bài viết
CREATE TABLE forum_media (
    id INT PRIMARY KEY IDENTITY(1,1),
    post_id INT NOT NULL,
    media_type NVARCHAR(10) NOT NULL, -- 'image' hoặc 'video'
    file_url NVARCHAR(500) NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type NVARCHAR(100),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE
);
GO

-- Tạo indexes để tối ưu truy vấn
CREATE INDEX IX_forum_posts_user ON forum_posts(user_id);
GO

CREATE INDEX IX_forum_posts_category ON forum_posts(category);
GO

CREATE INDEX IX_forum_comments_post ON forum_comments(post_id);
GO

CREATE INDEX IX_forum_comments_user ON forum_comments(user_id);
GO

CREATE INDEX IX_forum_likes_post ON forum_likes(post_id);
GO

CREATE INDEX IX_forum_likes_comment ON forum_likes(comment_id);
GO

-- Index cho việc tìm kiếm media
CREATE INDEX IX_forum_media_post ON forum_media(post_id);
GO

CREATE INDEX IX_forum_media_type ON forum_media(media_type);
GO

-- Trigger tự động cập nhật media_count và has_video khi thêm/xóa media
CREATE TRIGGER TR_Forum_Media_Insert
ON forum_media
AFTER INSERT
AS
BEGIN
    UPDATE p
    SET 
        media_count = (
            SELECT COUNT(*) 
            FROM forum_media 
            WHERE post_id = p.id
        ),
        has_video = CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM forum_media 
                WHERE post_id = p.id 
                AND media_type = 'video'
            ) 
            THEN 1 
            ELSE 0 
        END
    FROM forum_posts p
    INNER JOIN inserted i ON p.id = i.post_id;
END;
GO

CREATE TRIGGER TR_Forum_Media_Delete
ON forum_media
AFTER DELETE
AS
BEGIN
    UPDATE p
    SET 
        media_count = (
            SELECT COUNT(*) 
            FROM forum_media 
            WHERE post_id = p.id
        ),
        has_video = CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM forum_media 
                WHERE post_id = p.id 
                AND media_type = 'video'
            ) 
            THEN 1 
            ELSE 0 
        END
    FROM forum_posts p
    INNER JOIN deleted d ON p.id = d.post_id;
END;
GO

-- Thêm các ràng buộc và quy tắc
ALTER TABLE forum_media ADD CONSTRAINT CK_MediaType 
    CHECK (media_type IN ('image', 'video'));
GO

ALTER TABLE forum_media ADD CONSTRAINT CK_FileSize 
    CHECK (
        (media_type = 'image' AND file_size <= 5242880) OR -- 5MB cho ảnh
        (media_type = 'video' AND file_size <= 104857600)  -- 100MB cho video
    );
GO

-- Thêm index cho việc tìm kiếm bài viết có media
CREATE INDEX IX_forum_posts_has_media ON forum_posts(media_count, has_video);
GO

-- Các danh mục mặc định cho bài viết lịch sử
INSERT INTO forum_tags (name, description) VALUES
    (N'Thời kỳ đồ đá', N'Bài viết về thời kỳ đồ đá'),
    (N'Văn Lang - Âu Lạc', N'Bài viết về thời kỳ Văn Lang - Âu Lạc'),
    (N'Bắc thuộc', N'Bài viết về thời kỳ Bắc thuộc'),
    (N'Độc lập', N'Bài viết về các triều đại độc lập'),
    (N'Cận đại', N'Bài viết về lịch sử cận đại'),
    (N'Hiện đại', N'Bài viết về lịch sử hiện đại'),
    (N'Di tích', N'Bài viết về di tích lịch sử'),
    (N'Văn hóa', N'Bài viết về văn hóa lịch sử'),
    (N'Khảo cổ', N'Bài viết về khảo cổ học'),
    (N'Tư liệu', N'Tư liệu lịch sử'); 
GO

CREATE TABLE post_views (
  id INT IDENTITY(1,1) PRIMARY KEY,
  post_id INT NOT NULL,
  session_id NVARCHAR(255) NOT NULL,
  viewed_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (post_id) REFERENCES forum_posts(id)
);

CREATE INDEX IX_post_views_session ON post_views(post_id, session_id, viewed_at);

CREATE TABLE chat_history (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  question NVARCHAR(MAX) NOT NULL,
  answer NVARCHAR(MAX) NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);