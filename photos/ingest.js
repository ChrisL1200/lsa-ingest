var _ = require('lodash');
var Home = require('../home/schema');
var request = require('request');
var fs = require('graceful-fs');
var imageRequest = request.defaults({
  encoding: null, pool: {maxSockets: Infinity}, timeout: 30000
});

var homes = 0;
var received = 0;
var written = 0;
var total = 0;
var registeredDone = 0;
var timedout = false;
var finished = false;
var callback;

function photoCallback(result) {
	result.photosReceived++;
	written++;
	process.stdout.write("received: " + received + " written: " + written + " total: " + total + " homes: " + homes + "\r");
	// if(result.photosReceived === result.listing.photos[0].photo.length) {
	// 	if(written >= (total - 1) && finished){
	// 		console.log("DONE!");
	// 		callback();
	// 	}
	// }
}

function pauseStream(stream) {
	if((total > (received + 20)) && !timedout) {
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

function checkIfDone() {
	console.log(written + ', ' + registeredDone);
	if(written === registeredDone && finished) {
		console.log("Homes Ingest Complete");
		Photo.ingest(startDate);
		// callback();
	}
	else {
		registeredDone = written;
		setTimeout(checkIfDone, 30000);
	}
}

exports.ingest = function(startDate, async) {
	callback = async;
	console.log("Beginning photo ingest...");
	if (!fs.existsSync('images')){
	    fs.mkdirSync('images');
	}
	var stream = Home.find().where('status').ne('inactive').stream();
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
					if(result.ingestDate && result.ingestDate.getTime() > startDate) {
						if (!fs.existsSync(directory + (photo.mediaurl[0].hashCode().toString() + '.jpeg'))) {
							imageRequest({url: photo.mediaurl[0]}, 
								function (error, response, body) {
									received++;
							    if (!error && response.statusCode === 200) {
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
					else {
						result.photosReceived++;
				  	written++;
						if(fs.existsSync(photo.storedId)) {
							fs.unlinkSync(photo.storedId);
						}	
						if(result.photosReceived === result.listing.photos[0].photo.length) {
							result.status = 'inactive';
							result.save();
							if(written >= (total - 1) && finished){
								console.log("DONE!");
								callback();
							}
						}
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
};

String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length === 0) {
		return hash;
	}
	for (var i = 0; i < this.length; i++) {
		var character = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+character;
		hash = hash & hash; // Convert to 32bit integer
	}
	if(hash < 0) {
		hash = hash * -1;
	}
	return hash;
};
// Delete all photos that are expired records
// Maintain home records