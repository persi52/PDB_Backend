const express = require("express");
const fs = require('fs');
const router = express.Router();
const commentsController = require('../controllers/commentsController');
const verifyToken = require("../controllers/verifyToken");


router.post('/add',verifyToken,commentsController.addComment);
router.get('/get/:movie_id',commentsController.getComments);


module.exports = router;