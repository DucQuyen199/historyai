const geminiService = require('../services/geminiService');
const sql = require('mssql');
const config = require('../config/db');

class ChatController {
  async handleChat(req, res) {
    try {
      const { question } = req.body;
      const imageFile = req.file; // Bây giờ là buffer trong memory
      const userId = req.user?.id;

      if (!question?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập câu hỏi',
          answer: 'Vui lòng nhập câu hỏi để tôi có thể giúp bạn.'
        });
      }

      let response;
      if (imageFile?.buffer) {
        // Nếu có hình ảnh trong buffer, sử dụng vision model
        response = await geminiService.analyzeImage(imageFile, question);
      } else {
        // Nếu không có hình, sử dụng text model
        response = await geminiService.analyzeHistory(question);
      }

      if (!response.success) {
        return res.status(500).json({
          success: false,
          message: response.error,
          answer: response.answer
        });
      }

      // Log chat history nếu user đã đăng nhập
      if (userId) {
        const pool = await sql.connect(config);
        await pool.request()
          .input('user_id', sql.Int, userId)
          .input('question', sql.NVarChar, question)
          .input('answer', sql.NVarChar, response.answer)
          .query(`
            INSERT INTO chat_history (user_id, question, answer)
            VALUES (@user_id, @question, @answer)
          `);
      }

      res.json({
        success: true,
        ...response
      });

    } catch (error) {
      console.error('Chat controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        answer: 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.'
      });
    }
  }
}

module.exports = new ChatController(); 