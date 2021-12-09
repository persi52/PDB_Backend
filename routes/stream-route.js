const express = require("express");
const fs = require('fs');
const router = express.Router();
const streamingController = require('../controllers/streamController');

//router.get('/movies', streamingController.stream_video_get);

router.get('/play/:id',streamingController.stream_video);


module.exports = router;