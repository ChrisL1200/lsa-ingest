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
					doc._id = null;
					var score = 0;
					_.each(homes, function(home) {
						score += home.price;	
					});
					if(homes.length > 0) {
						score = score / homes.length;
					}
					//Have to reassign all non-primitives.... have no idea why 
					var coordinates = {
						latitude: doc.coordinates.latitude,
						longitude: doc.coordinates.longitude
					};
					var wkt = [];
					_.each(doc.wkt, function(point) {
						wkt.push({
							latitude: point.latitude,
							longitude: point.longitude
						});
					});
					var object = {
						mx_id: doc.mx_id,
						nces_disid: doc.nces_disid,
						nces_schid: doc.nces_schid,
						sch_name: doc.sch_name,
						ed_level: doc.ed_level,
						phone: doc.phone,
						score: score,
						coordinates: coordinates,
						wkt: wkt
					};
					Score.collection.insert(object, function (err) {
						if(err) {
							throw err;
						}
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