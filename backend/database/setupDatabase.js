const sql = require('mssql');
const config = require('../config/db');

async function setupDatabase() {
  // Kết nối đến master database trước
  const masterConfig = {...config, database: 'master'};
  
  try {
    console.log('Connecting to master database...');
    let pool = await sql.connect(masterConfig);
    
    // Kiểm tra xem database đã tồn tại chưa
    const dbCheck = await pool.request().query(`
      SELECT COUNT(*) as dbExists FROM sys.databases WHERE name = 'history_db'
    `);
    
    // Nếu chưa có, tạo database
    if (dbCheck.recordset[0].dbExists === 0) {
      console.log('Creating history_db database...');
      await pool.request().query(`CREATE DATABASE history_db`);
      console.log('Database history_db created successfully');
    } else {
      console.log('Database history_db already exists');
    }
    
    // Đóng kết nối đến master
    await pool.close();
    
    // Kết nối đến history_db để tạo các bảng
    console.log('Connecting to history_db...');
    const dbConfig = {...config, database: 'history_db'};
    pool = await sql.connect(dbConfig);
    
    // Tạo bảng users nếu chưa tồn tại
    const userTableQuery = `
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
    `;
    
    const tableResult = await pool.request().query(userTableQuery);
    console.log(tableResult.recordset[0].message);
    
    await pool.close();
    return true;
  } catch (error) {
    console.error('Database setup failed:', error);
    return false;
  }
}

// Chạy setup nếu file được chạy trực tiếp
if (require.main === module) {
  setupDatabase()
    .then(success => {
      console.log('Database setup completed:', success ? 'successfully' : 'with errors');
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal setup error:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase }; 