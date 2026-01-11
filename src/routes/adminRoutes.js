const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Chỉ Admin mới được xem thống kê (verifyToken để lấy user, sau đó có thể check role)
router.get('/stats', authMiddleware.verifyToken, authMiddleware.checkAdmin, adminController.getDashboardStats);

module.exports = router;
