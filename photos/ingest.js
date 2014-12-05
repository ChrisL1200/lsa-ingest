var _ = require('lodash');
var Home = require('../home/schema');
var request = require('request');
var async = require('async');
var fs = require('graceful-fs');
var imageRequest = request.defaults({
  encoding: null, pool: {maxSockets: Infinity}
});

var homes = 0;
var received = 0;
var written = 0;
var total = 0;
var timedout = false;
var finished = false;

exports.ingest = function(callback) {
	console.log("Beginning photo ingest...");
	if (!fs.existsSync('images')){
	    fs.mkdirSync('images');
	}
	var stream = Home.find().stream();
	stream.on('data', function (result) {
		homes++;
		pauseStream(this);
		if(result && result.listing.photos[0]) {
			result.photosReceived = 0;
			_.each(result.listing.photos[0].photo, function(photo){
				if(photo.mediaurl[0]) {
					var directory = 'images/' + (photo.mediaurl[0].hashCode() % 10000).toString();
					if (!fs.existsSync(directory)){
					    fs.mkdirSync(directory);
					}
					photo.storedId = directory + '/' + (photo.mediaurl[0].hashCode().toString()) + '.jpeg';
					total++;
					if (!fs.existsSync(directory + (photo.mediaurl[0].hashCode().toString() + '.jpeg'))) {
						imageRequest({url: photo.mediaurl[0]}, 
							function (error, response, body) {
								received++;
						    if (!error && response.statusCode == 200) {
					        body = new Buffer(body, 'binary');
					        fs.writeFile(photo.storedId, body, function (err) {
					        	if (err) { 
									  	console.log(err);
									  }
					        	photoCallback(result);
									});
							  }
							  else {
							  	written++;
							  	console.log(photo.mediaurl[0] + " : " + error);
							  }
						});
					}
					else {
						photoCallback(result);
					}
			  }
		  });
		}
	}).on('error', function (err) {
	  console.log(err);
	}).on('close', function () {
		console.log('Finished');
		finished = true;
	});
}

function photoCallback(result) {
	result.photosReceived++;
	written++;
	console.log("received: " + received + " written: " + written + " total: " + total + " homes: " + homes);
	if(result.photosReceived === result.listing.photos[0].photo.length) {
		// result.save();
		if(written >= (total - 1) && finished){
			console.log("DONE!");
		}
	}
}

function pauseStream(stream) {
	if((total > (written + 20)) && !timedout) {
		timedout = true;
		stream.pause();
		setTimeout(function() {
			timedout = false;
	    pauseStream(stream);
	  }, 150);
	}
	else {
		stream.resume();
	}
}

String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	if(hash < 0) {
		hash = hash * -1;
	}
	return hash;
}
// Delete all photos that are expired records
// Maintain home records