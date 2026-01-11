const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// User routes
router.post('/', authMiddleware.verifyToken, orderController.createNewOrder);
router.get('/', authMiddleware.verifyToken, orderController.getMyOrders);

// Admin routes (Phải đặt trước /:id)
router.get('/admin/all', authMiddleware.verifyToken, authMiddleware.checkAdmin, orderController.getAllOrdersAdmin);

// Dynamic routes
router.put('/:id/status', authMiddleware.verifyToken, authMiddleware.checkAdmin, orderController.updateStatusAdmin);
router.get('/:id', authMiddleware.verifyToken, orderController.getOrderDetail);

module.exports = router;