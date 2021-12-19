const express = require("express");
const fs = require('fs');
const router = express.Router();
const friendsController = require('../controllers/friendsController');
const verifyToken = require("../controllers/verifyToken");


router.post('/sendRequest',verifyToken,friendsController.sendFriendRequest);
router.post('/declineFriendRequest',verifyToken,friendsController.declineFriendRequest);
router.post('/acceptFriendRequest',verifyToken,friendsController.acceptFriendRequest);
router.post('/cancelFriendRequest',verifyToken,friendsController.cancelFriendRequest);
router.post('/remove',verifyToken,friendsController.removeFriend);
router.get('/get',verifyToken,friendsController.getUserFriends);
router.post('/getFriendStatus',verifyToken,friendsController.getFriendStatus);
router.get('/coverage/:friend_id',verifyToken,friendsController.getFriendTasteCoverage);



module.exports = router;