const express = require("express");
const fs = require('fs');
const router = express.Router();
const ratingsController = require('../controllers/ratingsController');
const verifyToken = require("../controllers/verifyToken");


router.post('/add',verifyToken,ratingsController.addRate);
router.get('/getBokiem',ratingsController.getBokiem);
router.get('/getRates/:movie_id',ratingsController.getRatesByMovieId);
router.post('/getRate',verifyToken,ratingsController.getUserRate);


module.exports = router;