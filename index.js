const express = require("express");
const cors = require("cors");
const path = require('path');

require("dotenv").config();
const { connectDB } = require('./src/config/database');

const productRoutes = require('./src/routes/productRoutes');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const shippingRoutes = require('./src/routes/shippingRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const returnRoutes = require('./src/routes/returnRoutes');

const app = express();

app.use(cors()); 
app.use(express.json()); 

// --- ĐĂNG KÝ ROUTE ---
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/returns', returnRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(` Server đang chạy tại http://localhost:${PORT}`);
    connectDB();
});
