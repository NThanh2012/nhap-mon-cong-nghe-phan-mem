const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware.verifyToken, returnController.createReturnRequest);
router.get('/', authMiddleware.verifyToken, returnController.getMyReturns);
router.get('/admin/:id', authMiddleware.verifyToken, authMiddleware.checkAdmin, returnController.getReturnDetailAdmin);
router.get('/admin', authMiddleware.verifyToken, authMiddleware.checkAdmin, returnController.getAllReturns);
router.put('/:id/status', authMiddleware.verifyToken, authMiddleware.checkAdmin, returnController.updateReturnStatus);

module.exports = router;
