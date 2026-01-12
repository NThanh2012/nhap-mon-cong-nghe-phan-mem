# SalesOrderProject

## Yêu cầu
- Node.js 18+ và npm
- SQL Server (hoặc Azure SQL)
- SSMS hoặc công cụ chạy script SQL

## Cài đặt database
1. Mở SQL Server và chạy `database/SQLQuery1.sql` (tạo mới DB, sẽ xóa DB cũ nếu có).
2. Chạy `database/seed.sql` để tạo bảng và dữ liệu mẫu.

## Cấu hình môi trường
Tạo hoặc chỉnh `.env` ở thư mục gốc:

```
DB_USER=sa
DB_PASSWORD=your_password
DB_SERVER=localhost
DB_DATABASE=SalesOrderDB
PORT=5000
JWT_SECRET=your_secret
```

## Chạy backend
Tại thư mục gốc:

```
npm install
npm start
```

API chạy mặc định tại `http://localhost:5000`.

## Chạy frontend
Mở terminal khác:

```
cd frontend
npm install
npm run dev
```

Frontend chạy mặc định tại `http://localhost:5173`.

Nếu backend chạy ở URL khác, sửa `frontend/src/api/axiosClient.js`.

## Thư viện cần cài
### Backend (package.json)
- bcryptjs
- cors
- dotenv
- express
- jsonwebtoken
- mssql
- multer

### Frontend (frontend/package.json)
- @ant-design/icons
- antd
- axios
- react
- react-dom
- react-router-dom
- react-toastify
- recharts

### Dev dependencies (frontend)
- @eslint/js
- @types/react
- @types/react-dom
- @vitejs/plugin-react
- eslint
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
- globals
- vite

## Ghi chú
- Tài khoản admin demo có sẵn trong DB, nếu không biết mật khẩu hãy tạo user mới rồi cập nhật `Role = 'admin'`.
- Script `SQLQuery1.sql` sẽ tạo thêm bảng `Payments`/`Shipments` (hiện code chưa dùng, không ảnh hưởng khi chạy).
