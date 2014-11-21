var School = require('../school/schema');
var Home = require('../home/schema');
var _ = require('lodash');
var inside = require('point-in-polygon');

exports.ingest = function() {
	var stream = School.find().stream();
	stream.on('data', function (doc) {
		if(doc) {
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
					// console.log(updateSchool);
				});

  			_.each(homes, function(home) {
					var updatedHome = _.merge(home, scores);
					updatedHome.save(function (err) {
  					// console.log("Added score to home model");
  				});
  			});
  		});
		}
	}).on('error', function (err) {
	  console.log(err);
	}).on('close', function () {
		console.log('Finished');
	});
}