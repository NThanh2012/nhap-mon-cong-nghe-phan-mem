const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/dashboard/stats
// Chỉ Admin mới được xem thống kê
router.get('/stats', 
    authMiddleware.verifyToken, // 1. Phải đăng nhập
    authMiddleware.checkAdmin,  // 2. Phải là Admin
    dashboardController.getDashboardStats
);

module.exports = router;