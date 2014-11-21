var CronJob = require('cron').CronJob;
var async = require('async');
var Home = require('./home/ingest');
var Score = require('./score/ingest');

var jobDaily= new CronJob({
  cronTime: '00 30 11 2-31 * *',
  onTick: function() {
    // Runs every weekday (Monday through Friday)
    // at 11:30:00 AM. It does not run on Saturday
    // or Sunday.
    console.log("Daily Ingest beginning...");
    async.series([Home.ingest, Score.ingest], function(err, results) {
    	console.log("Finished update");
    });
  },
  start: false,
  timeZone: "America/Los_Angeles"
});
jobDaily.start();