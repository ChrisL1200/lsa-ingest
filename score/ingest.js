var School = require('../school/schema');
var Home = require('../home/schema');
var _ = require('lodash');
var inside = require('point-in-polygon');

var written = 0;
var total = 0;
var timedout = false;
var finished = false;

exports.ingest = function() {
	var stream = School.find().stream();
	stream.on('data', function (doc) {
		if(doc) {
			pauseStream(this);
			total++;
			Home.find()
			.where('listing.location.latitude').gt(_.min(doc.wkt, 'latitude').latitude).lt(_.max(doc.wkt, 'latitude').latitude)
			.where('listing.location.longitude').gt(_.min(doc.wkt, 'longitude').longitude).lt(_.max(doc.wkt, 'longitude').longitude)
			.exec(function (err, homes) {
				var scores = {
					realEstate: 0,
					school: 0
				};

				var score = 0;
				var wkt = [];
				_.each(doc.wkt, function(element) {
						wkt.push([element.latitude, element.longitude]);
				});

				var medianHome = [];
				_.each(homes, function(home) {
					if(home.listing.location && inside([home.listing.location[0].latitude[0], home.listing.location[0].longitude[0]], wkt)) {
						medianHome.push(home.listing.listprice[0]);
          }
				});

				if(medianHome.length > 0) {
					medianHome.sort( function(a,b) {return a - b;} );
    			var half = Math.floor(medianHome.length/2);

    			if(medianHome.length % 2)
        		scores.realEstate = medianHome[half];
    			else
        		scores.realEstate = (medianHome[half-1] + medianHome[half]) / 2.0;
				}
				
				doc = _.merge(doc, {score: scores});
				doc.save(function (err, updateSchool) {
					console.log(" written: " + written + " total: " + total);
					written++;
					if((written > (total -1)) && finished){
						process.exit();
					}
				});

  			_.each(homes, function(home) {
  				total++;
					var updatedHome = _.merge(home, scores);
					updatedHome.save(function (err) {
					console.log(" written: " + written + " total: " + total);
						written++;
						if((written > (total -1)) && finished){
							process.exit();
						}
  				});
  			});
  		});
		}
	}).on('error', function (err) {
	  console.log(err);
	}).on('close', function () {
		console.log('Finished');
		finished = true;
	});
}

function pauseStream(stream) {
	if((total > (written + 500)) && !timedout) {
		console.log("FREEZE");
		timedout = true;
			stream.pause();
			setTimeout(function() {
				timedout = false;
	    pauseStream(stream);
	  }, 5000);
	}
	else {
		stream.resume();
	}
}