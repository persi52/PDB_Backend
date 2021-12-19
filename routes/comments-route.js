const express = require("express");
const fs = require('fs');
const router = express.Router();
const commentsController = require('../controllers/commentsController');
const verifyToken = require("../controllers/verifyToken");


router.post('/add',verifyToken,commentsController.addComment);
router.get('/get/:movie_id',verifyToken, commentsController.getComments);
router.post('/addCommentLike',verifyToken,commentsController.addCommentLike);
router.delete('/deleteCommentLike/:comment_id',verifyToken,commentsController.deleteCommentLike);
router.get('/getUserCommentLike/:comment_id',verifyToken,commentsController.getUserCommentLike);

module.exports = router;