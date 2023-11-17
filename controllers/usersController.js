// const fs = require('fs');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const catchAsyncError = require('../utils/catchAsyncError');
const { getOne, getAll, updateOne, deleteOne, create } = require('./handleFactory');

// const tour = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/users.json`)
// );

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  })
  return newObj;
}

exports.addIdToParams = (req, res, next) => {
  req.params.id = req.user.id
  next()
}

exports.getMe = getOne(User);

exports.getAllUsers = getAll(User)
exports.addUsers = create(User)
exports.updateUsers = updateOne(User)
exports.deleteUsers = deleteOne(User)
exports.getUser = getOne(User)

exports.deleteMe = catchAsyncError(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })
  
  res.status(204).json({
    status: 'success',
    data: null
  })
})
exports.updateMe = catchAsyncError(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for pasword update', 400));
  }

  const filteredData = filterObj(req.body, 'name', 'email');

  const user = await User.findByIdAndUpdate(req.user.id, filteredData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  })

})