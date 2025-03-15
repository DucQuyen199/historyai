const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config/db');

router.get('/db-test', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT 1 as test');
    
    res.json({
      success: true,
      message: 'Kết nối database thành công',
      data: result.recordset
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Kết nối database thất bại',
      error: error.message
    });
  }
});

router.get('/check-tables', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    res.json({
      success: true,
      message: 'Danh sách bảng',
      tables: result.recordset.map(r => r.TABLE_NAME)
    });
  } catch (error) {
    console.error('Check tables failed:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra bảng',
      error: error.message
    });
  }
});

router.get('/check-users', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT TOP 10 id, username, email, avatar_url, role, created_at
      FROM users
    `);
    
    res.json({
      success: true,
      message: 'Danh sách 10 người dùng đầu tiên',
      count: result.recordset.length,
      users: result.recordset
    });
  } catch (error) {
    console.error('Check users failed:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra users',
      error: error.message
    });
  }
});

module.exports = router; 