const express = require("express");
const fs = require('fs');
const router = express.Router();
const usersController = require('../controllers/usersController');
const verifyToken = require("../controllers/verifyToken");

router.get('/get_all',verifyToken,usersController.getUsers);
router.get('/searchUsers',verifyToken,usersController.getUsersToSearch);
router.get('/getUserById/:id',verifyToken, usersController.getUserById);
router.post('/account/changePassword',verifyToken,usersController.changePassword);
router.post('/account/changeNickname',verifyToken,usersController.changeNickname);
router.post('/account/changePicture',verifyToken, usersController.changeProfilePic);
router.get('/getCurrentUser', verifyToken, usersController.getCurrentUser);

module.exports = router;