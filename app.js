const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes');
const { Module } = require('module');

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorControlleer')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const reviewRouter = require('./routes/reviewRoutes')

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Global Middleware


// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Sets Security HTTP headers
app.use(helmet())
//-------------------------------------------

// Middleware for actually getting access to data coming through Post req object

// Morgan dev logs our request to server in console

// ----------------------------------------
if( process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

// API rateLimiting to prevent brute force attacks

const limiter = rateLimit({
    max: 100,
    windowMs: 30 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
})

app.use('/api', limiter);

// Body parser, '10kb' limits the max payload json size
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitize against XSS
app.use(xss());

// Prevent's parameter pollution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));




app.use('/api/tours', tourRouter);
app.use('/api/users', userRouter);

 //---------------------------------------------------

// for get request at '/'
// app.get('/', (req, res) => {
//     res.status(200).json({ message: 'Hello from server' })
// })

// app.post('/', (req, res) => {
//       res.send('you posted to / endpoint...')
// })

//--------------------------------------------

// Variables and optional parameters
// :id => variable :id? => optional param

// app.get('/api/tours/:id/:x?', (req, res) => {

//   //-----------------------------------

//   //here params are all srtings
//   const { id, x } = req.params
//   res.send(`got id = ${id}`)

// })

// -----------------------------------------

// Special error handling Middleware
app.use(globalErrorHandler)

module.exports = app
