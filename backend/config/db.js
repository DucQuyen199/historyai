require('dotenv').config();

// Cấu hình SQL Server cho macOS (qua Docker)
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
  server: process.env.DB_SERVER || 'localhost',
  database: 'history_db', // Đảm bảo đúng tên database
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    // Thêm port nếu SQL Server không chạy trên port mặc định
    port: parseInt(process.env.DB_PORT || '1433')
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

// Log cấu hình database khi khởi động
console.log('Database configuration:', {
  server: config.server,
  database: config.database,
  user: config.user,
  port: config.options.port
});

module.exports = config; 