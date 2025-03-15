const sql = require('mssql');
const config = require('../config/db');

async function checkSQLServer() {
  console.log('Checking SQL Server connection...');
  console.log('-------------------------------');
  
  try {
    // Thử kết nối đến master database
    const masterConfig = {...config, database: 'master'};
    console.log('Trying to connect to master database with:');
    console.log(JSON.stringify(masterConfig, null, 2));
    
    const pool = await sql.connect(masterConfig);
    console.log('✅ Connected to SQL Server successfully!');
    
    // Liệt kê tất cả databases
    const databases = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
    `);
    
    console.log('\nUser databases:');
    console.table(databases.recordset);
    
    await pool.close();
    return true;
  } catch (error) {
    console.error('❌ SQL Server connection failed:', error.message);
    
    // Đưa ra hướng dẫn dựa trên loại lỗi
    if (error.code === 'ELOGIN') {
      console.log('\n🔍 HƯỚNG DẪN KHẮC PHỤC:');
      console.log('1. Kiểm tra SQL Server đã chạy chưa');
      console.log('2. Kiểm tra tài khoản "sa" đã được bật và mật khẩu đúng chưa');
      console.log('3. Nếu đang sử dụng Docker, kiểm tra container SQL Server:');
      console.log('   - docker ps  (để xem container đang chạy)');
      console.log('   - docker logs <container_id>  (để xem log lỗi)');
      console.log('\nCách thiết lập SQL Server trên Docker cho macOS:');
      console.log('docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2019-latest');
    } else if (error.code === 'ESOCKET') {
      console.log('\n🔍 HƯỚNG DẪN KHẮC PHỤC:');
      console.log('1. SQL Server không chạy hoặc không thể kết nối đến địa chỉ/cổng đã cấu hình');
      console.log('2. Kiểm tra Docker container đã chạy chưa: docker ps');
      console.log('3. Kiểm tra port mapping: đảm bảo cổng 1433 được map đúng');
    }
    
    return false;
  }
}

// Chạy kiểm tra nếu file được chạy trực tiếp
if (require.main === module) {
  checkSQLServer()
    .then(result => {
      console.log('\nKết quả kiểm tra:', result ? 'Thành công' : 'Thất bại');
      process.exit(result ? 0 : 1);
    })
    .catch(err => {
      console.error('Lỗi không xác định:', err);
      process.exit(1);
    });
}

module.exports = { checkSQLServer }; 