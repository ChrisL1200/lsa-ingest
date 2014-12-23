var _ = require('lodash');
_.mixin(require("lodash-deep"));
var fs = require('fs');
var rimraf = require('rimraf');
var readline = require('readline');
var stream = require('stream');
var async = require('async');
var jf = require('jsonfile');
var School = require('./schema');
var parser = require('wellknown');

var filesMapped = 0;
var total = 0;
var inserted = 0;
var inserting = false;
var registeredDone = 0;
var callback;

function boundaryParser(line, keys) {
	var object = {};
	var output = line.split('|');
	_.each(output, function(row, i) {	
		if(i !== 7) {
			object[keys[i]] = row;
		} 
		else {					
			object.wkt = [];
			var wkt = parser.parse(row).coordinates[0];
			_.forEach(wkt, function(coord) {
				if(coord[0] instanceof Array) {
					_.forEach(coord, function(multiCoord){
						object.wkt.push({latitude: multiCoord[1], longitude: multiCoord[0]});
					});
				}
				else {
					object.wkt.push({latitude: coord[1], longitude: coord[0]});
				}
			});
		}
	});
	return object;
}

function mongoCreate(object, schoolComplete, district) {
	if(object.address && (object.address.state === 'VA' || object.address.state === 'MD' || object.address.state === 'DC' || object.address.state === 'WV')) {
		School.create(object, function (err) {
			if(err) {
				console.log(err);
			}
			district.counter++;
			schoolComplete();
			if(district.schools.length <= district.counter) {
				district.complete();	
			}
			inserted++;
			inserting = true;
	  });
	}
	else {
		setImmediate(function() {
			inserted++;
			district.counter++;
			schoolComplete();
			if(district.schools.length <= district.counter) {
				district.complete();	
			}
			inserting = true;
		}, 0);
	}
}

function recursiveFileReader(school, files, object, schoolComplete, district) {
	var directory = 'tmp/' + district.folder + '/' + school + '/' + files[0];
	var data;
	try {
		data = jf.readFileSync(directory);
	}
	catch(err) {
		console.log(directory);
		console.log(err);
	}
	if(data) {
		object = _.merge(object, data);
	}
	files.splice(0,1);
	if(files.length > 0) {
		recursiveFileReader(school, files, object, schoolComplete, district);
	}
	else {
		object = _.merge(object, schoolComplete, district.income);
		mongoCreate(object, schoolComplete, district);
	}
}

function checkIfDone() {
	console.log("inserted: " + inserted + " registeredDone: " + registeredDone );
	if(inserted === registeredDone && inserting) {
		// rimraf('tmp', function() {
			console.log("Schools Ingest Complete");
  		console.log(new Date());
			callback();
		// });
	}
	else {
		registeredDone = inserted;
		setTimeout(checkIfDone, 30000);
	}
}

exports.ingest = function(doneFunction) {
	callback = doneFunction;
	console.log("Ingesting Schools...");
	console.log("Starting map phase");
	
	var csvs = [{
		filename: './data/boundary/maponics_attendancezones_wkt.txt',
		boundary: true,
		tempFile: 'boundary'
	},{
		filename: './data/education/universal.csv',
		model: [
			{index:0, key: 'nces_schid'},
			{index:7, key: 'sch_name'},
			{index:9, key: 'address.street'},
			{index:10, key: 'address.city'},
			{index:11, key: 'address.state'},
			{index:12, key: 'address.zip'},
			{index:22, key:'coordinates.latitude'},
			{index:23, key:'coordinates.longitude'},
			{index:37, key:'freeLunch'},
			{index:38, key:'redLunch'},
			{index:289, key:'stRatio'},
			{index:266, key:'member'},
			{index:31, key:'titleOne'}
		],
		tempFile: 'universal'
	},{
		filename: './data/income/ACS_13_1YR_S1903_with_ann.csv',
		model: [
			{index:1, key: 'nces_disid'},
			{index:6, key: 'income'}
		],
		tempFile: 'income'
	},
	{
		filename: './data/education/reading.csv',
		model: [
			{index:4, key: 'nces_schid'},
			{index:7, key: 'allReading'}
		],
		tempFile: 'reading'
	}, {
		filename: './data/education/math.csv',
		model: [
			{index:4, key: 'nces_schid'},
			{index:7, key: 'allMath'}
		],
		tempFile: 'math'
	}];

	if(!fs.existsSync('tmp')) {
		fs.mkdirSync('tmp');
	}
	School.remove({}, function(err) { 
		if(err) {
			console.log(err);
		}
		_.each(csvs, function(csv) {
			var instream = fs.createReadStream(csv.filename);
			var outstream = new stream();
			var rl = readline.createInterface(instream, outstream);
			var firstLine = true;
			var keys = [];
			rl.on('line', function(line) {
				var object = {};
				if(firstLine) {
					keys = line.split('|');
					firstLine = false;
				}
				else {
					if(csv.boundary) {
						object = boundaryParser(line, keys);
					}
					else {
						var columns = line.split(',');
						if(!firstLine) {
							_.each(csv.model, function(item) {
								_.deepSet(object, item.key, columns[item.index]);
							});
						}
						else {
							firstLine = false;
						}
					}
					var ncesIdFolder, folder;
					if(csv.tempFile === 'income') {
						ncesIdFolder = 'tmp/' + object['nces_disid'];
					}
					else {
						folder = object['nces_schid'].substring(0,7);
						var directory = 'tmp/' + folder.trim();
						ncesIdFolder = directory + '/' + object['nces_schid'].trim();

						if(!fs.existsSync(directory)) {
							fs.mkdirSync(directory);
						}
					}

					if(!fs.existsSync(ncesIdFolder)) {
						total++;
						fs.mkdirSync(ncesIdFolder);
					}

					if(!fs.existsSync(ncesIdFolder + '/' + csv.tempFile + '.json')) {
						jf.writeFileSync(ncesIdFolder + '/' + csv.tempFile + '.json', object); 
					}
				}
			});

			rl.on('close', function() {
				console.log("Finished " + csv.tempFile);
				filesMapped++;
				if(filesMapped === csvs.length) {
					console.log("Starting reduce phase");
					var folders = fs.readdirSync('tmp');
					async.eachLimit(folders, 1, function(folder, complete) {
						var district = {
							counter: 0,
							folder: folder,
							schools: fs.readdirSync('tmp/' + folder),
							income: {},
							complete: complete
						};
						if(fs.existsSync('tmp/' + folder + '/income.json')) {
							try {
								district.income = jf.readFileSync('tmp/' + folder + '/income.json');
							}
							catch(err) {
								console.log(err);
							}
						}
						var noFolders = true;
					  async.eachLimit(district.schools, 20, function(school, schoolComplete) {
							if(fs.lstatSync('tmp/' + folder + '/' + school).isDirectory()) {
								noFolders = false;
								var files = fs.readdirSync('tmp/' + folder + '/' + school);
								var object = {};
								recursiveFileReader(school, files, object, schoolComplete, district);
							}
							else {
								district.counter++;
							}
						});
						if(noFolders) {
							district.complete();
						}
					});
					checkIfDone();
				}
			});
		});
	});
};