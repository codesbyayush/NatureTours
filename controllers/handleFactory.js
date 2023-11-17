const catchAsyncError = require('../utils/catchAsyncError');
const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/appError');

exports.getAll = (Model , popOptions) => catchAsyncError(async (req, res, next) => {
  
  // Small hack to get reviews also working
  let filter = {};
  if (req.params.tourId) {
      filter = {
          tour: req.params.tourId
      }
  }

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .pagination()
      .limitFields();
  
    const docs = await features.query;
  
    res.status(200).json({
      status: 'success',
      data: {
        docs,
      },
    });
});
  
exports.create = Model => catchAsyncError(async (req, res, next) => {

    const newDoc = await Model.create(req.body);
  
    res.status(201).json({
      status: 'success',
      data: {
        docs: newDoc
      },
    });
});
  
exports.getOne = (Model, popOptions) => catchAsyncError(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    if( popOptions ) query = query.populate(popOptions)
    const docs = await query;
  
    if (!docs) {
        return next(new AppError('No Document found with that ID', 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            docs,
        },
    })
})

exports.updateOne = Model => catchAsyncError(async (req, res, next) => {

    const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  
    if (!updatedDoc) {
      return next(new AppError('No Document found with that ID', 404))
    }
  
  
    res.status(200).json({
      status: 'success',
      data: {
        docs: updatedDoc
      },
    });
});
  
exports.deleteOne = Model =>  catchAsyncError(async (req, res, next) => {
    
    const doc = await Model.findByIdAndDelete(req.params.id);
  
    if (!doc) {
      return next(new AppError('No Document found with that ID', 404))
    }
  
    
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
  
  