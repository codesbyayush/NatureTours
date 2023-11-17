const fs = require('fs')
const dotenv = require('dotenv');
const mongoose = require('mongoose')
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const { exit } = require('process');
const Review = require('../../models/reviewModel');


// using dotenv to get access to environment variables declared in config file
dotenv.config({ path: '../../config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB);

const data = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'));
const data1 = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
const data2 = JSON.parse(fs.readFileSync('./reviews.json', 'utf-8'));

(async () => {

  await Tour.deleteMany()
  await User.deleteMany()
  await Review.deleteMany()
  await User.create(data1, { validateBeforeSave: false})
  await Tour.create(data)
  await Review.create(data2)
  process.exit(0)
} 
)()
