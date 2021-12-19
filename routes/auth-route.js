const express = require("express");
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require("../controllers/verifyToken");

router.post('/signUp', authController.signUp);
router.post('/signIn', authController.signIn);
router.get('/getCurrentUser', verifyToken ,authController.getCurrentUser);


module.exports = router;