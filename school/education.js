var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var _ = require('lodash');
_.mixin(require("lodash-deep"));
var School = require('./schema');
var Ingest = require('./ingest');

var readObjects = [];

exports.ingest = function(objects, callback) {
	readObjects = objects;
	var instream = fs.createReadStream(readObjects[0].filename);
	var outstream = new stream;
	var rl = readline.createInterface(instream, outstream);
	var education = {
		ingested: 0,
		inserted: 0,
		finished: false,
		firstLine: true,
		keys: []
	};
	console.log("Parsing " + readObjects[0].filename);
	rl.on('line', function(line) {
		var columns = line.split(',');
		if(!education.firstLine) {
			var mergeSchool = {};
			_.each(readObjects[0].model, function(item) {
				_.deepSet(mergeSchool, item.key, columns[item.index]);
			});
			rowCallback(mergeSchool, education);
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

function checkIfBlocked(mergeSchool, education) {
	if(Ingest.containsNCES(mergeSchool['nces_schid'])) {
		console.log("Blocked: " + mergeSchool['nces_schid']);
		setTimeout(checkIfBlocked, 500, mergeSchool, education);
	}
	else {
		Ingest.addNCES(mergeSchool['nces_schid']);
		rowCallback(mergeSchool, education);
	}
}

function rowCallback(mergeSchool, education) {
	education.ingested++;
	School.findOne({nces_schid: mergeSchool['nces_schid']}, function(err, school){
		if(err) {
			console.log(err);
		}
		var updated = _.merge(school, mergeSchool);
		education.inserted++;
		if(school) {
  		updated.save(function (err, updatedSchool) {
				mongoCallback(updatedSchool, err, education);
  		});
		}
		else {
			School.create(mergeSchool, function (err, newSchool) {
				mongoCallback(newSchool, err, education);
      });
		}
	});
}

function mongoCallback(school, err, education) {
	// Ingest.removeNCES(school['nces_schid']);
	if(err) {
		console.log(err);
	}
	if(education.finished && (education.inserted === (education.ingested - 1))) {
		console.log("Finished parsing " + readObjects[0].filename);
		readObjects.splice(0,1);
		if(readObjects.length > 0) {
			exports.ingest(readObjects);
		}
		else {
			callback();
		}
	}
}