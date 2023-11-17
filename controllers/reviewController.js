const Review = require('../models/reviewModel');

const catchAsyncError = require('../utils/catchAsyncError')

const AppError = require('../utils/appError')

const APIFeatures = require('../utils/APIFeatures');
const { getAll, create, updateOne, deleteOne, getOne } = require('./handleFactory');

exports.getAllReviews = getAll(Review)
// catchAsyncError(async (req, res, next) => {


//     const reviews = await Review.find(filter)
//         // .populate({
//         //     path: 'user',
//         //     select: 'name'
//         // })
//         // .populate({
//         //     path: 'tour',
//         //     select: 'name'
//         // });

//     res.status(200).json({
//         status: 'success',
//         data: {
//             reviews
//         }
//     })
// })

exports.setTourUserIds = (req, res, next) => {
    
    if(!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user._id
    
    next();
}

exports.createReview = create(Review);

//     catchAsyncError(async (req, res, next) => {
//     const newReview = await Review.create(req.body);
//     res.status(200).json({
//         status: 'success',
//         data: {
//             newReview
//         }
//     })
// })

exports.updateReview = updateOne(Review);

exports.deleteReview = deleteOne(Review);

exports.getReview = getOne(Review)
