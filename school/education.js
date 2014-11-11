var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var _ = require('lodash');
var School = require('./schema');

exports.ingest = function() {
	var instream = fs.createReadStream('./data/education/universal.csv');
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);
	var ingested = 0;
	var inserted = 0;
	var finished = false;
	console.log("Parsing education files....");
	rl.on('line', function(line) {
		ingested++;
		var columns = line.split(',');
		var mergeSchool = {phone: columns[8], coordinates: {latitude: columns[22], longitude: columns[23]}};
		School.findOne({nces_schid: columns[0]}, function(err, school){
			var updated = _.merge(school, mergeSchool);
			inserted++;
			if(school) {
				console.log(updated);
    		updated.save(function (err, updatedSchool) {
					if(err) {
						console.log(err);
					}
    			console.log("Updated: ");
    			console.log(updatedSchool);
					if(finished && (inserted === (ingested - 1))) {
						console.log("Finished education files...");
						process.exit();
					}
    		});
  		}
  		else {
  			mergeSchool.nces_schid = columns[0];
  			School.create(mergeSchool, function (err, newSchool) {
					if(err) {
						console.log(err);
					}
					if(finished && (inserted === (ingested - 1))) {
						console.log("Finished education files...");
						process.exit();
					}
        });
  		}
		});
	});

	rl.on('close', function() {
		finished = true;
	});
}