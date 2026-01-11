const express = require('express');
const router = express.Router();

const userController = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware.verifyToken, userController.getMyProfile);

module.exports = router;