const mongoose = require('mongoose');
const { ObjectId } = require('mongodb')
const Tour = require('../models/tourModel')

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a valid user']
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tours',
        required: [true, 'Review must belong to a tour']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: [true, "Reviews can't be empty"]
    }
},
    {
        toJSON: { virtuals: true },
        toObject: {virtuals: true}
    }
)

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRating = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: {$avg: '$rating'}
            }
        }
    ])

    if( stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: stats[0].nRating,
            ratingAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: 0,
            ratingAverage: 4.5
        })
    }
}

reviewSchema.post('save', function () {
    this.constructor.calcAverageRating(this.tour)
})

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne();
    next();
})

reviewSchema.post(/^findOneAnd/, async function () {
    await this.r.constructor.calcAverageRating(this.r.tour)
})

const Review = mongoose.model('Review',reviewSchema)
module.exports = Review