const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
const { ObjectId } = require('mongodb');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, ' Name required for tour'],
        unique: true
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, ' A tour must have a destination']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A Tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Enter a correct difficulty value'
        }
    },
    ratingAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1'],
        max: [5, 'Rating must be below 5'],
        set: val => Math.round( val*10)/10
    },
    ratingQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A Tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
            // this. do not work with updates it's only available for NEW document creation
            return val < this.price
            },
            message: 'Discount price {VALUE} should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A Tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A Tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        // Hidden to api
        select: false
    },
    startDate: [Date],
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},
    {
        toJSON: { virtuals: true },
        toObject: {virtuals: true}
})


tourSchema.index({ price: 1, ratingAverage: -1 })
tourSchema.index({ slug: 1 })
tourSchema.index({ startLocation: '2dsphere'})


// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
}) 


// Document middleware: runs before .save() and .create() but not before .insertMany()
// We can have these for query, aggregate also

tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next();
})

// Embedding Tours witth guides
// tourSchema.pre('save', async function (next) {
//     const guides = this.guides.map(async id => {
//         return await User.findById(id);
//     })
//     this.guides = await Promise.all(guidesPromise);
//     next()
// })



const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;