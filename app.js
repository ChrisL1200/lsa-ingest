/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');

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
  mongoose.connect('mongodb://heroku:rxH-44oMRwBqmuRPUlzdGk_D56cxJXAZ9jDNesWXvgMYA-YFYiVhnXman46tBYCCehQnOuepdHUmLANc7GH41g@kahana.mongohq.com:10044/app27322759');
}
else {
  console.log("Ingesting to Development...");
  mongoose.connect('mongodb://localhost/lsa-dev');
}

if(args.ingest === 'schools') {
    var School = require('./school/ingest');
    School.ingest();
}
if(args.ingest === 'homes') {
    var Home = require('./home/ingest');
    Home.ingest();
}
if(args.ingest === 'scores') {
    var Score = require('./score/ingest');
    Score.ingest();
}
