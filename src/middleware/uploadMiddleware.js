const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }); }

// lưu trữ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(" MULTER ĐANG CHẠY! Đã nhận được file:", file.originalname); 
        const correctPath = path.join(__dirname, '../../public/uploads');
        cb(null, correctPath);
        // nơi lưu ảnh
    },
    filename: (req, file, cb) => {
        // tên file ảnh = tgian hiện tại + đuôi file gốc (ví dụ: 1736245000.png)
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        console.log("❌ File bị từ chối do sai định dạng:", file.mimetype);
        cb(new Error('Chỉ được upload file ảnh!'), false);
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    //limits: { fileSize: 100 * 1024 * 1024 } // Giới hạn dung lượng 100mb
});

module.exports = upload;