const catchAsyncError = require('../utils/catchAsyncError');
const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/appError');

const Tour = require('../models/tourModel');
const { updateOne, getAll, create, getOne, deleteOne } = require('./handleFactory');

exports.getAllTours = getAll(Tour)

exports.createTours = create(Tour)

exports.getTours = getOne(Tour , { path: 'reviews' , select: '-__v -createdAt'})

// Do not try to update password through this as all the save middlewares will not run as this is using findByIdAndUpdate method under the hood
exports.updateTours = updateOne(Tour)

exports.deleteTours = deleteOne(Tour)

// Middleware to check if correct data reccieved in post request
exports.checkPayload = (req, res, next) => {
  const data = req.body;
  if (!(data.name || data.price))
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price property',
    });
  next();
};

// Aggregation Pipeline
exports.getTourStats = catchAsyncError(async (req, res, next) => {
  // try {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.2 } },
    },
    {
      $group: {
        _id: null,
        numTours: { $sum: 1 },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
      $sort: {
        avgPrice: 1,
      },
    },
  ]);
  res.status(204).json({
    status: 'success',
    data: {
      stats,
    },
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getMonthlyPlan = catchAsyncError(async (req, res, next) => {
  // try {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { month: 1 },
    },
  ]);
  res.status(204).json({
    status: 'success',
    data: {
      plan,
    },
  });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getToursWithin = catchAsyncError(async (req, res, next) => {
  const { distance, latlon, unit } = req.params;
  const [lat, lon] = latlon.split(',');
  
  if (!lat || !lon) {
    next( new AppError("Please specify latitude and longitude", 400))
  }

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
    $centerSphere: [[lon, lat], radius]
  }} })

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  })
})

exports.getDistances = catchAsyncError(async (req, res, next) => {
  const { latlon, unit } = req.params;
  const [lat, lon] = latlon.split(',');

  const multiplyer = unit === 'mi' ? 0.000621371 : 0.001
  
  if (!lat || !lon) {
    next( new AppError("Please specify latitude and longitude", 400))
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lon * 1, lat * 1]
        },
        distanceFeild: 'distance',
        distanceMultiplier: multiplyer
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    data: {
      distances
    }
  })
})
