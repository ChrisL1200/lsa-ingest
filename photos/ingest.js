var _ = require('lodash');
var Home = require('../home/schema');
var request = require('request');
var async = require('async');
var fs = require('graceful-fs');
var urls = [];
var lastRunDate = new Date(0);
var imageRequest = request.defaults({
  encoding: null, pool: {maxSockets: Infinity}
});
var started = false;
var homes = 0;
var sent = 0;
var received = 0;
var written = 0;
var total = 0;
var timedout = false;

exports.ingest = function(callback) {
	console.log("Beginning photo ingest...");
	if (!fs.existsSync('images')){
	    fs.mkdirSync('images');
	}
	var stream = Home.find().stream();
	stream.on('data', function (result) {
		pauseStream(this);
		if(result && result.listing.photos[0]) {
			_.each(result.listing.photos[0].photo, function(photo){
				var id = 'xxx/xxx/4xx/yxxx/xxxx'.replace(/[xy]/g, function(c) {
			    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			    return v.toString(16);
				});

				var checkDirectory = id.split('/');
				_.each([[0],[0,1],[0,1,2],[0,1,2,3]], function(dirs) {
					var directory = 'images/';
					_.each(dirs, function(dir, index) {
						directory += checkDirectory[dir];
						if(index !== (dirs.length - 1)) {
							directory += '/';
						}
					});
					if (!fs.existsSync(directory)){
					    fs.mkdirSync(directory);
					}
				});
				total++;
				photo.storedId = id + '.jpeg';
				imageRequest({url: photo.mediaurl[0]}, 
					function (error, response, body) {
						received++;
				    if (!error && response.statusCode == 200) {
			        body = new Buffer(body, 'binary');
			        fs.writeFile('images/' + id + '.jpeg', body, function (err) {
			        	written++;
							  if (err) throw err;
								console.log("received: " + received + " written: " + written + " total: " + total);
							});
						}
				});
			});
			result.save();
		}
	}).on('error', function (err) {
	  console.log(err);
	}).on('close', function () {
		console.log('Finished');
	});
}

function pauseStream(stream) {
	if((total > (written + 1000)) && !timedout) {
		timedout = true;
		console.log("FREEZE");
		stream.pause();
		setTimeout(function() {
			timedout = false;
	    pauseStream(stream);
	  }, 300);
	}
	else {
		stream.resume();
	}
}