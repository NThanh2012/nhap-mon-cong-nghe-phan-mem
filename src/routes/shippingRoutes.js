const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/',
    authMiddleware.verifyToken,
    shippingController.getShippingMethods
);

router.post('/calculate', 
    authMiddleware.verifyToken, 
    shippingController.calculateShippingFee
);

module.exports = router;
