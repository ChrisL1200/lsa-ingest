/**
 * Main application file
 */

'use strict';
var School = require('./school/ingest');
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
process.argv.forEach(function (val) {
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
    console.log(new Date());
    School.ingest();
}
else if(args.ingest === 'homes') {
    Home.ingest();
}
else if(args.ingest === 'photos') {
    Photo.ingest(0);
}
else if(args.ingest === 'scores') {
    Score.ingest();
}
else { 
  console.log("Complete ingest starting...");
  console.log(new Date());
  async.parallel([School.ingest, Home.ingest], function() {
    async.parallel([Photo.ingest, Score.ingest], function() {
      console.log("Finished complete ingest");
      console.log(new Date());
      process.exit();
    });
  });
}

// gnNyj6wEAM0rK