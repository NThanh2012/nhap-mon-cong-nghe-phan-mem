const express = require('express')
const router = express.Router();
const productController = require('../controllers/productController')
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 1. Lấy danh sách (Không cần token)
router.get('/', productController.getProduct);

// 2. Lấy chi tiết (Không cần token)
router.get('/:id', productController.getDetailProduct);

// 3. Tạo mới sản phẩm (Cần Token Admin + Có Upload ảnh)
router.post('/', 
    authMiddleware.verifyToken, 
    authMiddleware.checkAdmin, 
    upload.single('image'), 
    productController.newProduct
);

// 4. Cập nhật sản phẩm (Cần Token Admin + Có Upload ảnh)
router.put('/:id', 
    authMiddleware.verifyToken, 
    authMiddleware.checkAdmin, 
    upload.single('image'), 
    productController.upProduct 
);

// 5. Xóa sản phẩm (Cần Token Admin)
router.delete('/:id', 
    authMiddleware.verifyToken, 
    authMiddleware.checkAdmin,  
    productController.deProduct
);

module.exports = router;