
const { sql } = require('../config/database');

async function getProducts(page, limit, keyword, sort, category) {
    try {
        const pool = await new sql.ConnectionPool(require('../config/database').config).connect();
        const offset = (page - 1) * limit;
        const hasCategory = category && category !== 'all';
        const categoryClause = hasCategory ? 'AND Category = @category' : '';

        // 1. Xử lý logic Sắp xếp (ORDER BY)
        let orderByClause = 'ORDER BY Id DESC'; // Mặc định: Mới nhất lên đầu

        if (sort === 'price_asc') {
            orderByClause = 'ORDER BY Price ASC'; // Giá thấp đến cao
        } else if (sort === 'price_desc') {
            orderByClause = 'ORDER BY Price DESC'; // Giá cao đến thấp
        }

        // 2. Câu lệnh SQL chính (Lấy sản phẩm)
        // Lưu ý: SQL Server bắt buộc phải có ORDER BY thì mới dùng được OFFSET (phân trang)
        const queryProducts = `
            SELECT * FROM Products 
            WHERE Name LIKE @keyword 
            ${categoryClause}
            ${orderByClause} 
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        // 3. Câu lệnh đếm tổng (để phân trang)
        const queryCount = `SELECT COUNT(*) as total FROM Products WHERE Name LIKE @keyword ${categoryClause}`;

        const request = new sql.Request(pool);
        request.input('keyword', sql.NVarChar, `%${keyword}%`);
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);
        request.input('category', sql.NVarChar, category);

        // Chạy song song cả 2 câu lệnh cho nhanh
        const [productsResult, countResult] = await Promise.all([
            request.query(queryProducts),
            request.query(queryCount)
        ]);

        const totalItems = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        pool.close(); // Đóng kết nối

        return {
            products: productsResult.recordset,
            totalItems,
            totalPages,
            currentPage: page
        };

    } catch (err) {
        throw err;
    }
}
async function getProductsById(id) {
    try {
        const req = new sql.Request();
        req.input("id",sql.Int, id);
        console.log("Model đang tìm ID:", id);
        const result = await req.query("SELECT * FROM Products WHERE Id = @id");
        return result.recordset[0];
    }
    catch(err) {
        console.log("ko co san pham ma id");
        throw err;
    }
}
async function createProduct(newDataProduct) {
    try {
        const req = new sql.Request();
        console.log("📦 Dữ liệu Model nhận được:", newDataProduct);
        req.input("name", sql.NVarChar, newDataProduct.name);
        req.input("sku", sql.VarChar, newDataProduct.sku);
        req.input("price", sql.Decimal, newDataProduct.price);
        req.input("stock", sql.Int, newDataProduct.stockQuantity); 
        req.input("desc", sql.NVarChar, newDataProduct.description);
        req.input("category", sql.NVarChar, newDataProduct.category || 'other');
        req.input("image", sql.NVarChar, newDataProduct.image || null);
        const Query = `
            INSERT INTO Products (Name, Sku, Price, StockQuantity, Description, Category, Image)
            VALUES (@name, @sku, @price, @stock, @desc, @category, @image)
        `;
        const res = await req.query(Query);
        return res;
    } catch(err) {
        console.log("sai ",err);
        throw err;
    }
}

async function updateProduct(id, productData) {
    try {
        const pool = await new sql.ConnectionPool(require('../config/database').config).connect();
        const request = new sql.Request(pool); // ⚠️ Sửa dòng này: dùng new sql.Request(pool) chuẩn hơn

        // Input các tham số cơ bản
        request.input('id', sql.Int, id);
        request.input('name', sql.NVarChar, productData.name);
        request.input('price', sql.Decimal(18, 2), productData.price);
        request.input('stock', sql.Int, productData.stockQuantity); // Đảm bảo bên controller gửi đúng key stockQuantity
        request.input('desc', sql.NVarChar, productData.description);
        request.input('sku', sql.NVarChar, productData.sku);
        request.input('category', sql.NVarChar, productData.category);

        // Tạo câu lệnh SQL động
        let query = `
            UPDATE Products 
            SET Name = @name, 
                Price = @price, 
                StockQuantity = @stock, 
                Description = @desc,
                Sku = @sku,
                Category = @category
        `;

        // 👇 CHỈ KHI CÓ ẢNH MỚI THÌ MỚI UPDATE CỘT IMAGE
        if (productData.image) {
            query += `, Image = @image `; 
            request.input('image', sql.NVarChar, productData.image);
        }

        query += ` WHERE Id = @id`;

        const result = await request.query(query);
        pool.close(); // Nhớ đóng kết nối
        return result;

    } catch (err) {
        console.log("SQL Error:", err); // Log lỗi SQL nếu có
        throw err;
    }
}

async function deleteProduct(id) {
    const pool = await new sql.ConnectionPool(require('../config/database').config).connect();
    
    try {
        // 1. Kiểm tra xem sản phẩm đã có người mua chưa (Nằm trong SalesOrderLines)
        const checkOrder = await pool.request()
            .input('Id', sql.Int, id)
            .query("SELECT COUNT(*) as count FROM SalesOrderLines WHERE ProductId = @Id");
            
        // Nếu đếm được > 0 tức là đã có đơn hàng -> Cấm xóa
        if (checkOrder.recordset[0].count > 0) {
            throw new Error("Sản phẩm này đã có trong lịch sử đơn hàng, không thể xóa!");
        }

        // 2. Nếu chưa ai mua, tiến hành xóa (Dùng Transaction để an toàn)
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const req = new sql.Request(transaction);
            req.input('Id', sql.Int, id);

            // Bước A: Xóa khỏi Giỏ hàng của mọi người trước (CartItems)
            // (Xóa giỏ hàng thì không sao, chỉ là khách thấy mất món đó trong giỏ thôi)
            await req.query("DELETE FROM CartItems WHERE ProductId = @Id");

            // Bước B: Xóa sản phẩm gốc
            const result = await req.query("DELETE FROM Products WHERE Id = @Id");

            await transaction.commit(); // Chốt sổ
            return result;

        } catch (err) {
            await transaction.rollback(); // Có lỗi thì hoàn tác
            throw err;
        }

    } catch (err) {
        throw err;
    } finally {
        pool.close(); // Đóng kết nối
    }
}
module.exports = {getProducts, getProductsById, createProduct, updateProduct, deleteProduct};
