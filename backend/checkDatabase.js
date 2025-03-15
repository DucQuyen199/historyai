const sql = require('mssql');
const config = require('./config/db');

async function checkDatabase() {
  try {
    console.log('Attempting to connect to database...');
    console.log('Connection config:', {
      server: config.server,
      database: config.database,
      user: config.user
    });
    
    const pool = await sql.connect(config);
    console.log('Connected to database successfully!');
    
    // Kiểm tra bảng users
    const result = await pool.request().query(`
      SELECT COUNT(*) as userTableExists FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'users'
    `);
    
    if (result.recordset[0].userTableExists > 0) {
      console.log('✅ Users table exists');
      
      // Đếm số lượng user
      const userCount = await pool.request().query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Number of users: ${userCount.recordset[0].count}`);
      
      // Hiển thị cấu trúc bảng
      const tableStructure = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'users'
      `);
      
      console.log('✅ Users table structure:');
      console.table(tableStructure.recordset);
    } else {
      console.log('❌ Users table does not exist!');
    }
    
    await sql.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkDatabase().catch(console.error); 