const express = require("express");
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require("../controllers/verifyToken");

router.post('/signUp', authController.signUp);
router.post('/signIn', authController.signIn);
router.delete('/signOut', authController.signOut);
router.get('/get_all',authController.getUsers);
router.get('/searchUsers',verifyToken,authController.getUsersToSearch);
router.get('/getCurrentUser', verifyToken ,authController.getCurrentUser);
router.get('/getUserById/:id',verifyToken, authController.getUserById);
router.post('/account/changePassword',verifyToken,authController.changePassword);
router.post('/account/changeNickname',verifyToken,authController.changeNickname);
router.post('/account/changePicture',verifyToken, authController.changeProfilePic);

module.exports = router;