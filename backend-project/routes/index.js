var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({ 
    success: true, 
    message: 'Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', function(req, res, next) {
  res.json({ 
    success: true, 
    message: 'Server is healthy', 
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;