/**
 * Main application file
 */

'use strict';
var School = require('./school/boundary');
var Home = require('./home/ingest');
var Photo = require('./photos/ingest');
var Score = require('./score/ingest');
var async = require('async');
var mongoose = require('mongoose');
// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// require('longjohn');

var args = {};
// Command line args
process.argv.forEach(function (val, index, array) {
    var argSplit = val.split('=');
    if(argSplit.length > 1) {
        args[argSplit[0]] = argSplit[1];
    }
});

// Connect to database
if(args.env === 'prod') {
  console.log("Ingesting to Production...");  
  mongoose.connect('mongodb://localhost/lsa');
}
else {
  console.log("Ingesting to Development...");
  mongoose.connect('mongodb://localhost/lsa-dev');
}

if(args.ingest === 'schools') {
    School.ingest();
}
else if(args.ingest === 'homes') {
    var Home = require('./home/ingest');
    Home.ingest();
}
else if(args.ingest === 'photos') {
    Photo.ingest();
}
else if(args.ingest === 'scores') {
    Score.ingest();
}
else {
  async.parallel([School.ingest, Home.ingest], function(err, results) {
    Score.ingest();
  });
}
