var School = require('../school/schema');
var Home = require('../home/schema');
var Score = require('./schema');
var _ = require('lodash');

exports.ingest = function() {
	Score.remove({}, function(err) { 
		var stream = School.find().stream();
		stream.on('data', function (doc) {
			if(doc) {
				Home.find()
				.where('coordinates.latitude').gt(_.min(doc.wkt, 'latitude').latitude).lt(_.max(doc.wkt, 'latitude').latitude)
				.where('coordinates.longitude').gt(_.min(doc.wkt, 'longitude').longitude).lt(_.max(doc.wkt, 'longitude').longitude)
				.exec(function (err, homes) {
					var score = 0;
					_.each(homes, function(home) {
						score += home.price;	
					});

					if(homes.length > 0) {
						score = score / homes.length;
					}

					var scores = {score: score};
					var updated = _.merge(doc, scores);
					updated.save(function (err) {
	    				console.log("Found and updated");
	    			});

	    			_.each(homes, function(home) {
						var updatedHome = _.merge(home, scores);
						updatedHome.save(function (err) {
	    					console.log("Added score to home model");
	    				});
	    			});
		  		});
			}
		}).on('error', function (err) {
		  throw err;
		}).on('close', function () {
			console.log('Finished');
		});
	});
}