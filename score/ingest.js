var School = require('../school/schema');
var Home = require('../home/schema');
var _ = require('lodash');
var inside = require('point-in-polygon');
// var memwatch = require('memwatch');
// memwatch.on('leak', function(info) {
// 	console.log(info);
// });
// memwatch.on('stats', function(stats) {
// 	console.log(stats); 
// });

var written = 0;
var total = 0;
var finished = false;
var timedout = false;

function parseTestScore(test) {
	var testScore = parseInt(test);
	if(isNaN(testScore)) {
		if(test && test !== "NULL") {
			testScore = parseInt(test.replace(/\D/g,''));
		}
		else {
			testScore = 1;
		}	
	}
	return testScore;
}

exports.ingest = function() {
	var stream = School.find().stream();
	stream.on('data', function (doc) {
		pauseStream(this);
		// total++;
		Home.find()
		.where('listing.location.latitude').gt(_.min(doc.wkt, 'latitude').latitude).lt(_.max(doc.wkt, 'latitude').latitude)
		.where('listing.location.longitude').gt(_.min(doc.wkt, 'longitude').longitude).lt(_.max(doc.wkt, 'longitude').longitude)
		.select('listing.location.latitude listing.location.longitude listing.listprice')
		.exec(function (err, homes) {
			var scores = {
				realEstate: 0,
				school: 0
			};

			/* Real Estate Score */
			var wkt = [];
			_.each(doc.wkt, function(element) {
					wkt.push([element.latitude, element.longitude]);
			});

			var medianHome = [];
			var boundaryHomes = [];
			_.each(homes, function(home) {
				if(home.listing.location && inside([home.listing.location.latitude, home.listing.location.longitude], wkt)) {
					medianHome.push(home.listing.listprice[0]);
					boundaryHomes.push(home);
        }
			});

			// if(medianHome.length > 0) {
			// 	medianHome.sort( function(a,b) {return a - b;} );
  	// 		var half = Math.floor(medianHome.length/2);

  	// 		if(medianHome.length % 2) {
   //    		doc.medianListing = medianHome[half];
   //    	}
  	// 		else {
   //    		doc.medianListing = (medianHome[half-1] + medianHome[half]) / 2.0;
   //    	}
			// }
			
			// if(doc.income && doc.medianListing) {
			// 	scores.realEstate = doc.medianListing / doc.income;
			// }

			// /* School Score */
			// var lunch = (((doc.freeLunch === -2  ? 1 : doc.freeLunch) + (doc.redLunch === -2 ? 1 : doc.redLunch)) / (doc.member === -2 ? 1 : doc.member)) * 100;
			// var stRatio = doc.stRatio === 0 ? 1 : doc.stRatio;

			// var titleOne;
			// switch(doc.titleOne) {
			// 	case "N":
			// 		titleOne = 1;
			// 		break;
			// 	case "M":
			// 		titleOne = 1;
			// 		break;
			// 	case "1":
			// 		titleOne = 100;
			// 		break;
			// 	case "2":
			// 		titleOne = 25;
			// 		break;
			// 	default:
			// 		titleOne = parseInt(doc.titleOne);
			// 		break;
			// }

			// var solReading = parseTestScore(doc.allReading);
			// var solMath = parseTestScore(doc.allMath);
			// lunch = isNaN(lunch) ? 1 : lunch;
			// titleOne = isNaN(titleOne) ? 1 : titleOne;
			// stRatio = isNaN(stRatio) ? 1 : stRatio;
			// solReading = isNaN(solReading) ? 1 : solReading;
			// solMath = isNaN(solMath) ? 1 : solMath;
			// scores.school = lunch * stRatio * titleOne * solReading * solMath;
			// scores.school = isNaN(scores.school) ? 0 : scores.school;
			// solReading = solMath = lunch = titleOne = stRatio = null;

			/* Overall Score */
			// scores.overall = scores.realEstate === 0 ? 0 : scores.school / scores.realEstate;

			/* Save Scores */
			// doc.score = scores;
			// setImmediate(function() {
			// 	doc.save(function (err) {
			// 		if(err){
			// 			console.log(err);
			// 		}
			// 		process.stdout.write(" written: " + written + " total: " + total + "\r");
			// 		written++;
			// 		if((written > (total -1)) && finished){
			// 			process.exit();
			// 		}
			// 	});
			// }, 0);

			//Update homes
			_.each(boundaryHomes, function(home) {
				total++;
				if(doc.ed_level) {
					var edLevels = doc.ed_level.split(',');
					_.each(edLevels, function(edLevel) {
						switch(doc.ed_level) {
							case '1':
								home.schools.elementary = doc._id;
								break;
							case '2':
								home.schools.middle = doc._id;
								break;
							case '3':
								home.schools.high = doc._id;
								break;
						}
					}); 
				}
				home.save(function (err) {
					if(err) {
						console.log(err);
					}
					process.stdout.write(" written: " + written + " total: " + total + "\r");
					written++;
					if((written > (total -1)) && finished){
						process.exit();
					}
				});
			});
		});
	}).on('error', function (err) {
	  console.log(err);
	}).on('close', function () {
		console.log('Finished');
		finished = true;
	});
};

function pauseStream(stream) {
	if((total > (written + 50)) && !timedout) {
		timedout = true;
			stream.pause();
			setImmediate(function() {
				timedout = false;
	    pauseStream(stream);
	  }, 100);
	}
	else {
		stream.resume();
	}
}