var fs = require('fs');
var _ = require('lodash');
var parser = require('wellknown');
var School = require('./schema');
var Ingest = require('./ingest');
var readline = require('readline');
var stream = require('stream');

exports.ingest = function(callback) {
	console.log("Parsing boundary files....");
	var keys;
	var inserted = 0;
	School.remove({}, function(err) { 
		var instream = fs.createReadStream(__dirname + '/../data/boundary/maponics_attendancezones_wkt.txt');
		var outstream = new stream;
		var rl = readline.createInterface(instream, outstream);
		var firstLine = true;
		var ingested = 0;
		var inserted = 0;
		var finished = false;
		rl.on('line', function(line) {
			ingested++;
			var output = line.split('|');
			if(!firstLine) {
				var object = {};
				_.each(output, function(row, i) {	
					if(i !== 7) {
						object[keys[i]] = row;
					} 
					else {					
						object.wkt = [];
						var wkt = parser.parse(row).coordinates[0];
						_.forEach(wkt, function(coord, index) {
							if(coord[0] instanceof Array) {
								_.forEach(coord, function(multiCoord){
									object.wkt.push({latitude: multiCoord[1], longitude: multiCoord[0]});
								});
							}
							else {
								object.wkt.push({latitude: coord[1], longitude: coord[0]});
							}

							if((wkt.length - 1) === index && object.wkt.length > 0) {
								School.create(object, function (err, created) {
									inserted++;
									if(err) {
										throw err;
									}
									if(finished && (inserted === (ingested - 1))) {
										console.log("Finished boundary files...")
										Ingest.ingest(callback);
									}
			          });
							}
						});
					}
				});
			}
			else {
				keys = output;
				firstLine = false;
			}
		});

		rl.on('close', function() {
			console.log("Finished ingest");
			finished = true;
		});
	});
}