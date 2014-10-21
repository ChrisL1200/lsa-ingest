/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');

// Connect to database
// mongoose.connect('mongodb://localhost/lsa-dev');

mongoose.connect('mongodb://heroku:rxH-44oMRwBqmuRPUlzdGk_D56cxJXAZ9jDNesWXvgMYA-YFYiVhnXman46tBYCCehQnOuepdHUmLANc7GH41g@kahana.mongohq.com:10044/app27322759');

// Calculate LSA Scores
require('./ingest');