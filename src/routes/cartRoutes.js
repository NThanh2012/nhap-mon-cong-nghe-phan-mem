const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.verifyToken);

// Xem giỏ
router.get('/', cartController.getMyCart);

// Thêm vào giỏ
router.post('/add', cartController.addItemToCart);

// Xóa 1 món 
router.delete('/remove/:id', authMiddleware.verifyToken, cartController.removeFromCart);

module.exports = router;