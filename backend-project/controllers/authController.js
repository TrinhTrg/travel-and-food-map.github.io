'use strict';

const admin = require('../config/firebaseConfig');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Cấu hình
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Tạo JWT token cho hệ thống của chúng ta
 * @param {Object} user - User object từ database
 * @returns {string} JWT token
 */
const generateSystemToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            id: user.id, // Thêm id để tương thích với middleware cũ
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Đăng nhập bằng Firebase (Google, Facebook, GitHub, v.v.)
 * Flow:
 * 1. Frontend gửi idToken từ Firebase
 * 2. Backend verify token với Firebase Admin SDK
 * 3. Tìm hoặc tạo user trong MySQL
 * 4. Trả về JWT token của hệ thống
 */
const loginWithFirebase = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        // 1. Validate input
        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'idToken là bắt buộc'
            });
        }

        // 2. Verify Firebase token
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (verifyError) {
            console.error('Firebase token verification failed:', verifyError.message);
            return res.status(401).json({
                success: false,
                message: 'Token Firebase không hợp lệ hoặc đã hết hạn',
                error: verifyError.code
            });
        }

        // 3. Lấy thông tin từ decoded token
        const {
            uid: firebaseUid,
            email,
            name,
            picture: avatar,
            firebase: firebaseInfo
        } = decodedToken;

        // Xác định provider (google, facebook, github, etc.)
        const authProvider = firebaseInfo?.sign_in_provider || 'firebase';

        console.log(`🔐 Firebase login attempt: ${email} via ${authProvider}`);

        // 4. Tìm user trong database
        let user = await User.findOne({ where: { email } });

        if (user) {
            // TRƯỜNG HỢP 1: User đã tồn tại (đồng bộ tài khoản cũ hoặc login lại)
            // Cập nhật firebase_uid và avatar mới nhất
            await user.update({
                firebase_uid: firebaseUid,
                avatar: avatar || user.avatar, // Giữ avatar cũ nếu không có mới
                auth_provider: authProvider,
                // Cập nhật name nếu user chưa có (trường hợp tài khoản cũ)
                name: user.name || name || email.split('@')[0]
            });

            console.log(`✅ Existing user synced: ${email} (ID: ${user.id})`);

        } else {
            // TRƯỜNG HỢP 2: User mới hoàn toàn
            user = await User.create({
                firebase_uid: firebaseUid,
                email: email,
                name: name || email.split('@')[0], // Fallback nếu không có name
                avatar: avatar || null,
                auth_provider: authProvider,
                role: 'customer', // Default role cho user mới
                password: null // Không cần password cho Firebase users
            });

            console.log(`✅ New user created: ${email} (ID: ${user.id})`);
        }

        // 5. Tạo JWT token của hệ thống
        const systemToken = generateSystemToken(user);

        // 6. Trả về response
        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                    authProvider: user.auth_provider
                },
                token: systemToken
            }
        });

    } catch (error) {
        console.error('❌ Firebase login error:', error);
        next(error);
    }
};

/**
 * Lấy thông tin user từ Firebase token (utility endpoint)
 * Dùng để verify token mà không cần login
 */
const verifyFirebaseToken = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'idToken là bắt buộc'
            });
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);

        res.json({
            success: true,
            data: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,
                picture: decodedToken.picture,
                provider: decodedToken.firebase?.sign_in_provider
            }
        });

    } catch (error) {
        console.error('Firebase token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Token không hợp lệ',
            error: error.code
        });
    }
};

/**
 * Đăng xuất (xóa session phía client)
 * Lưu ý: JWT là stateless, nên logout chỉ cần xóa token ở client
 */
const logout = (req, res) => {
    res.json({
        success: true,
        message: 'Đăng xuất thành công'
    });
};

module.exports = {
    loginWithFirebase,
    verifyFirebaseToken,
    logout
};
