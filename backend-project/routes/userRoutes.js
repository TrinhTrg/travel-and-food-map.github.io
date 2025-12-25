// routes/userRoutes.js
var express = require('express');
var router = express.Router();
var { requireAuth } = require('../middleware/auth');
const userController = require('../controllers/userController'); // Import Controller

router.post('/register', userController.register);
router.post('/login',    userController.login);
router.post('/logout',   userController.logout);
router.get('/profile',   requireAuth, userController.getProfile);
router.put('/profile',   requireAuth, userController.updateProfile);
router.post('/forgot-password', userController.forgotPassword);
router.get('/',          userController.healthCheck);

module.exports = router;