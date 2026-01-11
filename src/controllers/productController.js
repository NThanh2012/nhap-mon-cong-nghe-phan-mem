const fs = require('fs');
const path = require('path');

const { getProducts, getProductsById, createProduct, updateProduct, deleteProduct } = require('../models/productModel');

// xóa ảnh
const deleteImageFile = (imagePath) => {
    if (!imagePath) return; 
    // Đường dẫn này phải trỏ đúng vào thư mục public của bạn
    const fullPath = path.join(__dirname, '../../public', imagePath);
    
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(" Đã xóa file ảnh cũ tại:", fullPath);
    }
};

// 1. Lấy danh sách (Phân trang + Tìm kiếm)
async function getProduct(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const keyword = req.query.keyword || '';
        const sort = req.query.sort || 'newest';
        const category = req.query.category || '';
        const result = await getProducts(page, limit, keyword, sort, category);
        res.status(200).json({
            message: "Lấy danh sách sản phẩm thành công",
            data: result.products,
            pagination: {
                page: result.currentPage,
                limit: limit,
                totalItems: result.totalItems,
                totalPages: result.totalPages
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
}

// 2. Chi tiết sản phẩm
async function getDetailProduct(req, res) {
    try {   
        const data = await getProductsById(req.params.id)
        if(data) { res.status(200).json(data); }
        else {
            res.status(404).json({message: "Không có sản phẩm"});
        }
    } catch(err) {
        res.status(500).json({ message: "Lỗi hệ thống"});
    }
}

// 3. TẠO MỚI 
async function newProduct(req, res) {
    try {
        const productData = req.body;
        productData.category = productData.category || 'other';
        if (req.file) {
            productData.image = `/uploads/${req.file.filename}`;
        }

        const notifi = await createProduct(productData);
        
        if(notifi.rowsAffected[0] > 0) {
            res.status(201).json({
                message: "Đã thêm thành công sản phẩm",
                debug_file: req.file ? "Có nhận được file" : "KHÔNG có file",
                imagePath: productData.image 
            });
        }
        else 
            res.status(400).json({message: "Lỗi không thêm được giá trị"});
    }
    catch(err) {
        console.log("Lỗi Controller newProduct:", err);
        res.status(500).json({message: "Lỗi hệ thống"});
    }
}

// 4. CẬP NHẬT 
async function upProduct(req, res) {
    try {
        const productId = req.params.id;
        
        // 👇 COPY DỮ LIỆU TỪ req.body RA BIẾN MỚI
        // FormData gửi lên là string, ta ép kiểu về số cho chắc ăn
        const productData = {
            name: req.body.name,
            price: parseFloat(req.body.price), // Ép thành số thực
            stockQuantity: parseInt(req.body.stockQuantity), // Ép thành số nguyên
            description: req.body.description,
            sku: req.body.sku,
            category: req.body.category || 'other'
        };

        // Xử lý file ảnh (Nếu có upload ảnh mới)
        if (req.file) {
            // Lấy thông tin sản phẩm cũ để xóa ảnh cũ (nếu cần)
            const oldProduct = await getProductsById(productId);
            if (oldProduct && oldProduct.Image) {
                deleteImageFile(oldProduct.Image);
            }
            // Gán đường dẫn ảnh mới
            productData.image = `/uploads/${req.file.filename}`;
        }

        // Gọi Model update
        const notifi = await updateProduct(productId, productData);

        if(notifi.rowsAffected[0] > 0)
            res.status(200).json({
                message: "Đã sửa thành công sản phẩm", 
                image: productData.image || "Giữ nguyên ảnh cũ"
            });
        else 
            res.status(404).json({message: "Không tìm thấy sản phẩm để sửa"});

    } catch (err) {
        console.log("❌ Lỗi Update:", err); // In lỗi ra terminal để dễ debug
        res.status(500).json({message: "Lỗi hệ thống: " + err.message});
    }
}

// 5. XÓA
async function deProduct(req, res) {
    try {
        const productId = req.params.id;
        const product = await getProductsById(productId);
        const notifi = await deleteProduct(productId);
        if (notifi.rowsAffected[0] > 0) {
            if (product && product.Image) {
                deleteImageFile(product.Image); 
            }
            res.status(200).json({ message: "Đã xóa thành công sản phẩm và ảnh đi kèm" });
        } else {
            res.status(404).json({ message: "Không tìm thấy ID để xóa" });
        }
    } catch(err) {
        res.status(500).json({message: "Lỗi hệ thống"});
    }
}

module.exports = { getProduct, getDetailProduct, newProduct, upProduct, deProduct };
