const nodemailer = require('nodemailer');

// Cấu hình email transporter
// Sử dụng Gmail SMTP (bạn cần tạo App Password trong Gmail settings)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL || 'truongtrinhttt147@gmail.com',
      pass: process.env.ADMIN_PASSWORD || '123456',
    },
  });
};

// Controller xử lý gửi email liên hệ
const sendContactEmail = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate đầu vào
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ',
      });
    }

    // Kiểm tra cấu hình email
    const emailPassword = process.env.EMAIL_PASSWORD;
    if (!emailPassword) {
      console.error('EMAIL_PASSWORD chưa được cấu hình trong .env file');
      return res.status(500).json({
        success: false,
        message: 'Cấu hình email chưa đầy đủ',
      });
    }

    // Tạo transporter
    const transporter = createTransporter();

    // Email gửi đến bạn
    const mailOptions = {
      from: process.env.EMAIL_USER || 'truongtrinhttt147@gmail.com',
      to: 'truongtrinhttt147@gmail.com',
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <h2>Tin nhắn mới từ form liên hệ</h2>
        <p><strong>Họ và tên:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Chủ đề:</strong> ${subject}</p>
        <hr>
        <p><strong>Nội dung:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      text: `
Tin nhắn mới từ form liên hệ

Họ và tên: ${name}
Email: ${email}
Chủ đề: ${subject}

Nội dung:
${message}
      `,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.',
    });
  } catch (error) {
    console.error('Error sending contact email:', error);
    
    // Xử lý lỗi cụ thể cho Gmail authentication
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        success: false,
        message: 'Lỗi xác thực email',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi email. Vui lòng thử lại sau.',
    });
  }
};

module.exports = {
  sendContactEmail,
};
