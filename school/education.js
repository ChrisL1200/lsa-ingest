var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var _ = require('lodash');
var School = require('./schema');

exports.ingest = function() {
	var instream = fs.createReadStream('./data/education.csv');
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);
	rl.on('line', function(line) {
		var columns = line.split(',');
		var mergeSchool = {phone: columns[8], coordinates: {latitude: columns[22], longitude: columns[23]}};
		School.findOne({nces_schid: columns[0]}, function(err, school){
			var updated = _.merge(school, mergeSchool);
			if(school) {
	    		updated.save(function (err) {
	    			console.log("Found and updated");
	    		});
    		}
		});
	});

	rl.on('close', function() {
  		// do something on finish here
	});
}