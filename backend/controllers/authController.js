const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/db');
const path = require('path');
const fs = require('fs');

class AuthController {
  // Đăng ký tài khoản mới
  async register(req, res) {
    try {
      console.log('Register request body:', req.body);
      const { username, email, password } = req.body;

      // Kiểm tra thông tin đầu vào
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin: username, email, password'
        });
      }

      let pool;
      try {
        console.log('Connecting to database with config:', {
          server: config.server,
          database: config.database,
          user: config.user,
          port: config.options.port
        });
        
        pool = await sql.connect(config);
        console.log('Database connection successful');
        
        // Kiểm tra email đã tồn tại chưa
        const checkUser = await pool.request()
          .input('email', sql.NVarChar, email)
          .query('SELECT * FROM users WHERE email = @email');

        if (checkUser.recordset.length > 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Email đã được sử dụng' 
          });
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Sử dụng avatar mặc định
        const avatarUrl = '/uploads/avatars/default-avatar.png';

        console.log('Attempting to insert new user with values:', {
          username,
          email,
          passwordLength: hashedPassword.length,
          avatarUrl
        });

        // Thêm người dùng mới vào database
        const result = await pool.request()
          .input('username', sql.NVarChar, username)
          .input('email', sql.NVarChar, email)
          .input('password_hash', sql.NVarChar, hashedPassword)
          .input('avatar_url', sql.NVarChar, avatarUrl)
          .query(`
            INSERT INTO users (username, email, password_hash, avatar_url, role)
            OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.avatar_url, INSERTED.role
            VALUES (@username, @email, @password_hash, @avatar_url, 'user')
          `);

        if (!result.recordset || result.recordset.length === 0) {
          throw new Error('Không thể tạo người dùng mới');
        }

        const user = result.recordset[0];
        console.log('User created successfully:', user);

        // Tạo JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          process.env.JWT_SECRET || 'default_jwt_secret_key',
          { expiresIn: '7d' }
        );

        return res.status(201).json({
          success: true,
          message: 'Đăng ký thành công',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url,
            role: user.role
          }
        });
        
      } catch (dbError) {
        console.error('Database operation error:', dbError);
        
        // Xử lý các lỗi SQL cụ thể
        if (dbError.number === 2627) { // Violation of unique constraint
          return res.status(400).json({
            success: false,
            message: 'Email đã được sử dụng bởi tài khoản khác'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi thao tác với database: ' + dbError.message
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Đăng ký thất bại. Vui lòng thử lại!'
      });
    }
  }

  // Đăng nhập
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
      }

      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT * FROM users WHERE email = @email');

      if (result.recordset.length === 0) {
        return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      }

      const user = result.recordset[0];

      // Kiểm tra mật khẩu
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      }

      // Tạo JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'default_jwt_secret_key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi đăng nhập: ' + error.message });
    }
  }

  // Lấy thông tin người dùng hiện tại
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;

      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT id, username, email, avatar_url, role, bio FROM users WHERE id = @userId');

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }

      const user = result.recordset[0];

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          role: user.role,
          bio: user.bio
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin người dùng' });
    }
  }
}

module.exports = new AuthController(); 