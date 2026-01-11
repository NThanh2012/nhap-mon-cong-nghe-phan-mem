const express = require('express');
const router = express.Router();
const UserController = require('../controllers/authController');

router.post('/register', UserController.Register);
router.post('/login', UserController.login);

module.exports = router;  