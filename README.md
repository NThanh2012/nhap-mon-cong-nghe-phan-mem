# SalesOrderProject

## Tổng quan
Ứng dụng quản lý bán hàng gồm:
- Backend: Node.js + Express + SQL Server
- Frontend: React + Vite

## Yêu cầu
- Node.js 18+ (cần để dùng `node --watch`)
- SQL Server (local hoặc Azure SQL)
- SSMS hoặc công cụ chạy script SQL

## Bước 1: Cài database
1. Mở SQL Server Management Studio và kết nối vào instance đang dùng.
2. Chạy script `database/SQLQuery1.sql` để tạo DB `SalesOrderDB` và toàn bộ bảng.
   - Lưu ý: script này có thao tác DROP database nếu đã tồn tại.
3. Chạy `database/seed.sql` để thêm dữ liệu mẫu.
   - Script seed tạo sẵn user demo (`admin`, `customer`). Nếu không đăng nhập được, bạn có
     thể đăng ký user mới rồi cập nhật `Role = 'admin'` trong bảng `Users`.

## Bước 2: Cấu hình môi trường
Tạo hoặc chỉnh file `.env` ở thư mục gốc (không để khoảng trắng quanh dấu `=`):

```env
DB_USER=sa
DB_PASSWORD=your_password
DB_SERVER=localhost
DB_DATABASE=SalesOrderDB
PORT=5000
JWT_SECRET=your_secret
```

Gợi ý:
- Nếu dùng SQL Server Express: `DB_SERVER=localhost\\SQLEXPRESS`
- Với Azure SQL, điền đúng server và user theo cấu hình Azure.

## Bước 3: Chạy backend
Tại thư mục gốc:

```bash
npm install
npm start
```

Backend chạy tại `http://localhost:5000` và API mặc định là `http://localhost:5000/api`.

Nếu Node bạn không hỗ trợ `--watch`, có thể chạy:

```bash
node index.js
```

## Bước 4: Chạy frontend
Mở terminal khác:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

Nếu backend chạy khác URL/port, sửa `frontend/src/api/axiosClient.js`.

## Ghi chú nhanh
- File `src/config/database.js` đang bật `encrypt: true` và `trustServerCertificate: true`.
  Nếu gặp lỗi TLS khi kết nối local, bạn có thể thử đổi `encrypt` thành `false`.
- `database/SQLQuery1.sql` sẽ xóa DB cũ, chỉ chạy khi bạn chấp nhận mất dữ liệu cũ.
