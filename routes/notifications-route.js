const express = require("express");
const fs = require('fs');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const verifyToken = require("../controllers/verifyToken");


router.get('/get',verifyToken,notificationsController.getUserNotifications);
router.post('/remove',verifyToken,notificationsController.removeNotification);

module.exports = router;