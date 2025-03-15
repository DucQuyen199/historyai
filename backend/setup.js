const fs = require('fs');
const path = require('path');
const { createTablesIfNotExist } = require('./database/createTables');
const { setupDatabase } = require('./database/setupDatabase');

// Tạo thư mục uploads nếu chưa tồn tại
const setupDirectories = async () => {
  const dirs = [
    'public',
    'public/uploads',
    'public/uploads/avatars',
    'public/uploads/images',
    'public/uploads/videos'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }
  });
  
  // Tạo avatar mặc định nếu chưa có
  const defaultAvatarPath = path.join(__dirname, 'public/uploads/avatars/default-avatar.png');
  if (!fs.existsSync(defaultAvatarPath)) {
    // Tạo một file hình ảnh đơn giản
    const basicPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADvSURBVHhe7ZBBDoAgDAT5/6dRo4nRWGm3gHPZSRobYC+DHDOzRslVdIrBpQHt2Rj3xt4F7mN/Z/AxufW3cACu/hYOwNXfwgG4+ls4AFd/S9YAvHHo4ABc/S0cgKu/hQNw9bdwAK7+Fg7A1d/CAbj6WzgAV38rZQBPe3c4AFd/Cwfg6m/hAFz9LRyAq7+FA3D1t3AArv4WDsDV38r6F/j+fHbnyw3Im598ggNw9bdwAK7+Fg7A1d/CAbj6WzgAV38LB+Dqb+EAXP2t0gG8eX7CAbj6WzgAV3/Lo8DLDAPY3AkOwNXfwgG4+lvm44wzD9WfYCixgbJZAAAAAElFTkSuQmCC', 'base64');
    fs.writeFileSync(defaultAvatarPath, basicPng);
    console.log(`Created default avatar at: ${defaultAvatarPath}`);
  }
  
  // Tạo bảng trong database nếu chưa tồn tại
  await createTablesIfNotExist();
  
  // Thêm phần thiết lập database
  try {
    await setupDatabase();
    console.log('Database setup completed');
  } catch (error) {
    console.error('Database setup failed:', error);
  }
};

module.exports = { setupDirectories }; 