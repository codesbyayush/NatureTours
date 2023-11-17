const express = require('express');

const {
  getAllTours,
  createTours,
  getTours,
  updateTours,
  deleteTours,
  checkPayload,
  getTourStats,
  getToursWithin,
  getDistances,
} = require('../controllers/toursController');
const { protect, restrictTo } = require('../controllers/authController');

const reviewRouter = require('./reviewRoutes')

const router = express.Router();

// Middleware that acts when id param is passed
// router.param('id', (req, res, next, val) => {
//     console.log(val);
//     next();
// })


router.use('/:tourId/review', reviewRouter)

router
    .route('/tour-stats')
    .get(getTourStats);

router.route('/tours-within/:distance/center/:latlon/unit/:unit')
    .get(getToursWithin)

router.route('/distances/:latlng/unit/:unit')
    .get(getDistances)

router.route('/')
    .get(protect, getAllTours)
    .post(protect, restrictTo('admin'), checkPayload, createTours);

router
    .route('/:id')
    .get(getTours)
    .patch(updateTours)
    .delete(protect, restrictTo('admin'), deleteTours);

module.exports = router;
