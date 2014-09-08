/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');

// Connect to database
mongoose.connect('mongodb://localhost/lsa-dev');

// Calculate LSA Scores
require('./ingest');