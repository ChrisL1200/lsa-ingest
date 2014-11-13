var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var _ = require('lodash');
var School = require('./schema');
var Ingest = require('./ingest');
var async = require('async');

exports.ingest = function(filename, nces_schid) {
	var instream = fs.createReadStream(filename);
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);
	var education = {
		ingested: 0,
		inserted: 0,
		finished: false,
		firstLine: true,
		keys: []
	};
	console.log("Parsing " + filename);
	rl.on('line', function(line) {
		var columns = line.split(',');
		if(!education.firstLine) {
			var mergeSchool = {};
			_.each(education.keys, function(key, index) {
				mergeSchool[key] = columns[index];
			});
			checkIfBlocked(mergeSchool, education.keys[nces_schid], columns, education);
		}
		else {
			education.firstLine = false;
			education.keys = columns;
		}
	});

	rl.on('close', function() {
		education.finished = true;
	});
}

function checkIfBlocked(mergeSchool, nces_schid, columns, education) {
	if(Ingest.containsNCES(mergeSchool[nces_schid])) {
		console.log("Blocked: " + mergeSchool[nces_schid]);
		setTimeout(checkIfBlocked, 500, mergeSchool, nces_schid, columns, education);
	}
	else {
		Ingest.addNCES(mergeSchool[nces_schid]);
		rowCallback(mergeSchool, nces_schid, columns, education);
	}
}

function rowCallback(mergeSchool, nces_schid, columns, education) {
	education.ingested++;
	delete mergeSchool[education.keys[nces_schid]];
	mergeSchool['nces_schid'] = columns[nces_schid];
	School.findOne({nces_schid: mergeSchool['nces_schid']}, function(err, school){
		if(err) {
			console.log(err);
		}
		var updated = _.merge(school, mergeSchool);
		education.inserted++;
		if(school) {
			console.log("Updating a school...");
  		updated.save(function (err, updatedSchool) {
				Ingest.removeNCES(mergeSchool[nces_schid]);
				if(err) {
					console.log(err);
				}
				if(education.finished && (education.inserted === (education.ingested - 1))) {
					console.log("education.finished math files...");
					process.exit();
				}
  		});
		}
		else {
			console.log("Ingested: " + education.ingested);
			School.collection.insert(mergeSchool, function (err, newSchool) {
				Ingest.removeNCES(mergeSchool[nces_schid]);
				if(err) {
					console.log(err);
				}
				if(education.finished && (education.inserted === (education.ingested - 1))) {
					console.log("education.finished math files...");
					process.exit();
				}
      });
		}
	});
}