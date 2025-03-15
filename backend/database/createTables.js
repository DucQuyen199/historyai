const sql = require('mssql');
const config = require('../config/db');

async function createTablesIfNotExist() {
  try {
    console.log('Checking and creating database tables...');
    const pool = await sql.connect(config);
    
    // Kiểm tra bảng users
    const usersTable = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
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
        )
        SELECT 'Created users table' AS message
      END
      ELSE
        SELECT 'Users table already exists' AS message
    `);
    
    console.log(usersTable.recordset[0].message);
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}

module.exports = { createTablesIfNotExist }; 