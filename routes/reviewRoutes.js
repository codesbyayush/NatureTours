const express = require('express');
const { getAllReviews, getReview, createReview, setTourUserIds, updateReview, deleteReview } = require('../controllers/reviewController')
const authController = require('../controllers/authController')

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/')
    .get(
        getAllReviews)
    .post(
        authController.restrictTo('user'),
        setTourUserIds,
        createReview
    )

router.route('/:id')
    .get(getReview)
    .patch(authController.restrictTo('user', 'admin') ,updateReview)
    .delete(authController.restrictTo('user', 'admin'), deleteReview)


module.exports = router;