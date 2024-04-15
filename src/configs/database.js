const mongoose = require('mongoose');
const environments = require('./environments');

mongoose.connect(environments.DATABASE_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });