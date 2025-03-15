const sql = require('mssql');
const config = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const userController = {
  updateProfile: async (req, res) => {
    try {
      const { username, email, bio } = req.body;
      const userId = req.user.id;
      let avatar_url = null;

      // Xử lý upload avatar nếu có
      if (req.file) {
        const fileName = req.file.filename;
        avatar_url = `/uploads/avatars/${fileName}`;
      }

      const pool = await sql.connect(config);
      
      // Update user info
      const updateQuery = `
        UPDATE users 
        SET 
          username = @username,
          email = @email,
          bio = @bio
          ${avatar_url ? ', avatar_url = @avatar_url' : ''}
        WHERE id = @userId;

        SELECT * FROM users WHERE id = @userId;
      `;

      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('username', sql.NVarChar, username)
        .input('email', sql.NVarChar, email)
        .input('bio', sql.NVarChar, bio || null)
        .input('avatar_url', sql.NVarChar, avatar_url)
        .query(updateQuery);

      if (result.recordset.length > 0) {
        const updatedUser = result.recordset[0];
        res.json({
          success: true,
          message: 'Cập nhật thông tin thành công',
          user: updatedUser
        });
      } else {
        throw new Error('User not found');
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể cập nhật thông tin'
      });
    }
  },

  updateSettings: async (req, res) => {
    try {
      const { email_notifications, public_email } = req.body;
      const userId = req.user.id;

      const pool = await sql.connect(config);
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('emailNotifications', sql.Bit, email_notifications)
        .input('publicEmail', sql.Bit, public_email)
        .query(`
          UPDATE users 
          SET 
            email_notifications = @emailNotifications,
            public_email = @publicEmail
          WHERE id = @userId
        `);

      res.json({
        success: true,
        message: 'Cập nhật cài đặt thành công'
      });

    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể cập nhật cài đặt'
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.id;

      const pool = await sql.connect(config);
      
      // Kiểm tra mật khẩu hiện tại
      const user = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT password_hash FROM users WHERE id = @userId');

      if (user.recordset[0].password_hash !== current_password) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      // Cập nhật mật khẩu mới
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('newPassword', sql.NVarChar, new_password)
        .query('UPDATE users SET password_hash = @newPassword WHERE id = @userId');

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });

    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể đổi mật khẩu'
      });
    }
  }
};

module.exports = userController; 