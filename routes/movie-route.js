const express = require("express");
const router = express.Router();
const movieController = require('../controllers/movieController');
const verifyToken = require("../controllers/verifyToken");

router.get('/get_all',movieController.getMovies);
router.get('/getMovie/:movie_id',movieController.getMovieById);
router.get('/get_all/genres/:genre_id',movieController.getMoviesByGenre);
router.get('/genres/get_all',movieController.getGenres);
router.get('/getRated',verifyToken,movieController.getRatedMovies);
router.get('/getRecommended',verifyToken,movieController.getRecommendedMovies);
router.post('/add/favourites',verifyToken,movieController.addToFavourites);
router.get('/get/favourites',verifyToken,movieController.getUserFavourites);
router.get('/get/favourites/:user_id',verifyToken,movieController.getFriendFavourites);
router.post('/remove/favourites',verifyToken,movieController.removeFromFavourites);
router.get('/is_favourite/:movie_id',verifyToken,movieController.isMovieInFavourites);
router.post('/add/toWatch',verifyToken,movieController.addToWatch);
router.get('/get/toWatch',verifyToken,movieController.getUserToWatch);
router.get('/get/rated/:user_id',verifyToken,movieController.getFriendRated);
router.post('/remove/toWatch',verifyToken,movieController.removeFromToWatch);
router.get('/is_toWatch/:movie_id',verifyToken,movieController.isMovieInToWatch);
router.get('/get/graph',verifyToken,movieController.getUserGenresPercentage)

module.exports = router;