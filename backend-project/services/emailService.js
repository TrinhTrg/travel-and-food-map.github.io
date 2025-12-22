const nodemailer = require('nodemailer');

// Tạo transporter cho Gmail
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Gửi email thông báo phong Owner
const sendOwnerPromotionEmail = async (userEmail, userName) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"FoodGo Admin" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '🎉 Chúc mừng! Bạn đã được phong làm Owner trên FoodGo',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b35, #f7c331); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Chúc mừng ${userName}!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333;">Bạn đã được phong làm Owner trên FoodGo</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Xin chào <strong>${userName}</strong>,
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Chúng tôi vui mừng thông báo rằng tài khoản của bạn đã được nâng cấp lên <strong style="color: #ff6b35;">Owner</strong>!
            </p>
            
            <h3 style="color: #333;">Với quyền Owner, bạn có thể:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>✅ Tạo và quản lý nhà hàng của riêng bạn</li>
              <li>✅ Thêm, sửa, xóa các món ăn trong menu</li>
              <li>✅ Theo dõi đánh giá từ khách hàng</li>
              <li>✅ Cập nhật thông tin nhà hàng bất cứ lúc nào</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                 style="background: linear-gradient(135deg, #ff6b35, #f7c331); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px;
                        font-weight: bold;
                        display: inline-block;">
                Bắt đầu quản lý nhà hàng ngay
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.<br/>
              © 2024 FoodGo - Khám phá ẩm thực Việt Nam
            </p>
          </div>
        </div>
      `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully to:', userEmail);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Gửi email thông báo từ chối Owner (nếu cần)
const sendRoleDemotionEmail = async (userEmail, userName, newRole) => {
    try {
        const transporter = createTransporter();

        const roleLabels = {
            user: 'Người dùng',
            owner: 'Owner',
            admin: 'Admin'
        };

        const mailOptions = {
            from: `"FoodGo Admin" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: 'Thông báo thay đổi quyền trên FoodGo',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #333; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Thông báo từ FoodGo</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #666; line-height: 1.6;">
              Xin chào <strong>${userName}</strong>,
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Chúng tôi thông báo rằng quyền của bạn trên FoodGo đã được thay đổi thành: 
              <strong style="color: #333;">${roleLabels[newRole] || newRole}</strong>
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Nếu bạn có thắc mắc về việc thay đổi này, vui lòng liên hệ với Admin.
            </p>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              © 2024 FoodGo - Khám phá ẩm thực Việt Nam
            </p>
          </div>
        </div>
      `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully to:', userEmail);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOwnerPromotionEmail,
    sendRoleDemotionEmail
};
