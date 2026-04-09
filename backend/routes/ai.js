const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { analyze, chat } = require('../controllers/aiController');

// All AI endpoints require an authenticated user
router.post('/analyze', protect, analyze);
router.post('/chat', protect, chat);

module.exports = router;
