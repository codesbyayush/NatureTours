const dotenv = require('dotenv');
const mongoose = require('mongoose')

process.on('unhandledException', err => {
    console.log('Unhandled Exception ----> Shutting down');
    console.log(err.name, err.message);
        process.exit(1);
})

// using dotenv to get access to environment variables declared in config file
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB);

// Creates data testTour in accordance to schema Tour
// const testTour = new Tour({
//     name: 'The Forest hiker',
//     rating: 4.8,
//     price: 298
// })

// Saves testTour to database and return a Promise
// testTour.save().then(docu => console.log(docu)).catch(err => console.log(err));

const app = require('./app');

const server = app.listen(process.env.PORT, () => console.log('Listening on port 8000'));

process.on('unhandledRejection', err => {
    console.log('Unhandled Promise rejection ----> Shutting down');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    })
})