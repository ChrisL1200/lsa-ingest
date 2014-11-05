var fs = require('fs');
var _ = require('lodash');
var parser = require('wellknown');
var School = require('./schema');
var Education = require('./education');

exports.ingest = function() {
	console.log("Parsing boundary files....");
	var keys;
	var inserted = 0;
	School.remove({}, function(err) { 
		fs.readFile(__dirname + '/../data/boundary/maponics_sample_us_attendance_zones_wkt.txt', 'utf8', function read(err, data) {
			if (err) {
            	throw err;
        	}
			var splitData = data.split('\r\n');
			_.each(splitData, function(item, index) {
				var output = item.split('|');
				if(index !== 0) {
					var object = {};
					_.each(output, function(row, i) {	
						if(i !== 7) {
							object[keys[i]] = row;
						} 
						else {					
							object.wkt = [];
							_.forEach(parser.parse(row).coordinates[0], function(coord) {
								if(coord[0] instanceof Array) {
									_.forEach(coord, function(multiCoord){
										object.wkt.push({latitude: multiCoord[1], longitude: multiCoord[0]});
									});
								}
								else {
									object.wkt.push({latitude: coord[1], longitude: coord[0]});
								}
							});
							School.collection.insert(object, function (err) {
								if(err) {
									throw err;
								}
								inserted++;
								if(inserted === splitData.length-2) {
									console.log("Finished parsing boundary files");
									Education.ingest();
								}
		                	});
						}
					});
				}
				else {
					keys = output;
					keys.splice(keys.indexOf('_id'));
				}
			});
		});
	});	
}