// Middleware xử lý lỗi tổng quát
const errorHandler = (err, req, res, next) => {
  console.error('Global error handler caught:', err);
  
  // Nếu đã gửi response rồi thì return
  if (res.headersSent) {
    return next(err);
  }
  
  // Xử lý các loại lỗi khác nhau
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: err.errors
    });
  }
  
  // Trả về lỗi chung nếu không xác định được loại lỗi
  return res.status(500).json({
    success: false,
    message: 'Lỗi server: ' + (err.message || 'Đã xảy ra lỗi không xác định')
  });
};

module.exports = errorHandler; 