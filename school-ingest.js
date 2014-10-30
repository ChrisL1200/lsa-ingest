var parse = require('csv-parse');
var fs = require('fs');
var _ = require('lodash');
var parser = require('wellknown');
var School = require('./schema');
// First I want to read the file
console.log("Parsing boundary files....");
var inserted = 0;
School.remove({}, function(err) { 
	fs.readFile(__dirname + '/data/Fairfax_School_bndy.csv', 'utf8', function read(err, data) {
		parse(data, {comment: '#'}, function(err, output){
			_.forEach(output, function(row, index) {
				if(index !== 0) {
					var object = {wkt: [], sch_name: row[6], coordinates: {latitude: parseFloat(row[10]), longitude: parseFloat(row[11])}};
					_.forEach(parser.parse(row[0]).coordinates[0], function(coord) {
						if(coord[0] instanceof Array) {
							_.forEach(coord, function(multiCoord){
								object.wkt.push({latitude: multiCoord[1], longitude: multiCoord[0]});
							});
						}
						else {
							object.wkt.push({latitude: coord[1], longitude: coord[0]});
						}
					});
					// Get all school data

  					// Determine min/max lat/long -> Find all Homes within points -> Filter out those not in boundary -> Return subset
					var NWLat = _.max(object.wkt, 'latitude');
					var NWLong = _.min(object.wkt, 'longitude');
					var SELat = _.min(object.wkt, 'latitude');
					var SELong = _.max(object.wkt, 'longitude');

					School.collection.insert(object, function (err) {
						inserted++;
						console.log(inserted);
						if(inserted === output.length-1) {
							console.log("Finished ingesting school records");
							process.exit();
						}
                	});
				}
				else {
					console.log();
				}
			});
		});
	});
});