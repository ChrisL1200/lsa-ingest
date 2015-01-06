var CronJob = require('cron').CronJob;
var async = require('async');
var Home = require('./home/ingest');
var Score = require('./score/ingest');

var jobDaily= new CronJob({
  cronTime: '00 30 11 1-31 * *',
  onTick: function() {
    // Runs every weekday (Monday through Friday)
    // at 11:30:00 AM. It does not run on Saturday
    // or Sunday.
    console.log("Daily Ingest beginning...");
    var spawn = require('child_process').spawn,
    ls    = spawn('node', ['app.js', 'ingest=daily', 'env=prod']);

    ls.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    ls.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    ls.on('close', function (code) {
      console.log('child process exited with code ' + code);
    });
  },
  start: false,
  timeZone: "America/Los_Angeles"
});
jobDaily.start();