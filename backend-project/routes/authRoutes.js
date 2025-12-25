'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @route   POST /api/auth/firebase-login
 * @desc    Đăng nhập bằng Firebase (Google, Facebook, GitHub, etc.)
 * @access  Public
 * @body    { idToken: string }
 */
router.post('/firebase-login', authController.loginWithFirebase);

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify Firebase token (utility endpoint)
 * @access  Public
 * @body    { idToken: string }
 */
router.post('/verify-token', authController.verifyFirebaseToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/health
 * @desc    Health check
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth API is working'
    });
});

module.exports = router;
