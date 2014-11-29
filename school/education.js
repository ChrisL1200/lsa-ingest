var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var _ = require('lodash');
_.mixin(require("lodash-deep"));
var School = require('./schema');
var Ingest = require('./ingest');

var readObjects = [];
var timedout = false;

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
		// pauseStream(this, education);
		var columns = line.split(',');
		if(!education.firstLine) {
			education.ingested++;
			console.log("A Ingested: " + education.ingested + " Inserted: " + education.inserted);
			var mergeSchool = {};
			_.each(readObjects[0].model, function(item) {
				_.deepSet(mergeSchool, item.key, columns[item.index]);
			});
			rowCallback(mergeSchool, education, callback);
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
	School.findOneAndUpdate({nces_schid: mergeSchool['nces_schid']},mergeSchool,{upsert:true})
    .exec(function(err, school){
        if(err) {
            console.log(err);
        }
				mongoCallback(school, err, education, callback);
    });
	// School.findOne({nces_schid: mergeSchool['nces_schid']})
	// .lean()
	// .exec(function(err, school){
	// 	if(err) {
	// 		console.log(err);
	// 	}
	// 	if(school) {
	// 		delete mergeSchool['nces_schid'];
	// 		School.update({nces_schid: school['nces_schid']}, {$set: mergeSchool}, {multi: true})
	// 		.lean()
	// 		.exec(function (err, updatedSchool) {
	// 			console.log(err);
	// 			mongoCallback(updatedSchool, err, education);
 //  		});
	// 	}
	// 	else {
	// 		School.create(mergeSchool, function (err, newSchool) {
	// 			mongoCallback(newSchool, err, education);
 //      });
	// 	}
	// });
}

function mongoCallback(school, err, education, callback) {
	// Ingest.removeNCES(school['nces_schid']);
	education.inserted++;
	console.log("B Ingested: " + education.ingested + " Inserted: " + education.inserted);
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

function pauseStream(stream, education) {
	if((education.ingested > (education.inserted + 10000)) && !timedout) {
		timedout = true;
			stream.pause();
			setTimeout(function() {
				timedout = false;
	    pauseStream(stream, education);
	  }, 100);
	}
	else {
		stream.resume();
	}
}