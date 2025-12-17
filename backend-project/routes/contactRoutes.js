// routes/contactRoutes.js
var express = require('express');
var router = express.Router();
const contactController = require('../controllers/contactController');

// POST /api/contact - Gửi email liên hệ
router.post('/', contactController.sendContactEmail);

module.exports = router;
