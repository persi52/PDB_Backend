const express = require("express");
const fs = require('fs');
const router = express.Router();
const streamingController = require('../controllers/streamController');
const verifyToken = require("../controllers/verifyToken");

//router.get('/movies', streamingController.stream_video_get);

router.get('/play/:id',verifyToken,streamingController.stream_video);


module.exports = router;