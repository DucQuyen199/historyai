// Script khởi động đồng bộ cho backend
const { setupDatabase } = require('./database/setupDatabase');
const { createTablesIfNotExist } = require('./database/createTables');
const { checkSQLServer } = require('./utils/checkSQLServer');
const app = require('./app');
const { setupDirectories } = require('./setup');

const PORT = process.env.PORT || 5001;

// Function khởi động tuần tự
async function startServer() {
  try {
    console.log('=== KIỂM TRA VÀ THIẾT LẬP SERVER ===');
    
    // 1. Kiểm tra kết nối SQL Server
    console.log('\n1. Kiểm tra kết nối SQL Server...');
    const serverResult = await checkSQLServer();
    if (!serverResult) {
      console.error('❌ Không thể kết nối đến SQL Server. Vui lòng kiểm tra lại cấu hình.');
      process.exit(1);
    }
    
    // 2. Thiết lập database
    console.log('\n2. Thiết lập database...');
    const dbResult = await setupDatabase();
    if (!dbResult) {
      console.error('❌ Không thể thiết lập database. Vui lòng kiểm tra lại.');
      process.exit(1);
    }
    
    // 3. Tạo các bảng cần thiết
    console.log('\n3. Tạo các bảng dữ liệu...');
    const tablesResult = await createTablesIfNotExist();
    if (!tablesResult) {
      console.error('❌ Không thể tạo các bảng dữ liệu. Vui lòng kiểm tra lại.');
      process.exit(1);
    }
    
    // Setup required directories
    await setupDirectories();

    // Start server
    let currentPort = PORT;

    const server = app.listen(currentPort, '0.0.0.0', () => {
      console.log(`Server is running on port ${currentPort}`);
      console.log(`API available at http://localhost:${currentPort}/api`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${currentPort} is already in use. Trying next port...`);
        currentPort++;
        server.close(() => {
          app.listen(currentPort, '0.0.0.0', () => {
            console.log(`Server is now running on port ${currentPort}`);
          });
        });
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Chạy quy trình khởi động
startServer();