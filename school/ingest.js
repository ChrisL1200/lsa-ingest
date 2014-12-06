var _ = require('lodash');
_.mixin(require("lodash-deep"));
var fs = require('fs');
var rimraf = require('rimraf');
var readline = require('readline');
var stream = require('stream');
var jf = require('jsonfile');
var School = require('./schema');
var parser = require('wellknown');

var schoolList = [];
var filesMapped = 0;
var finished = false;
var total = 0;
var callback;
exports.ingest = function(async) {
	callback = async;
	console.log("Ingesting Schools...");
	var csvs = [{
		filename: './data/boundary/maponics_sample_us_attendance_zones_wkt.txt',
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
		_.each(csvs, function(csv) {
			var instream = fs.createReadStream(csv.filename);
			var outstream = new stream;
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
					var ncesIdFolder;
					if(csv.tempFile === 'income') {
						ncesIdFolder = 'tmp/' + object['nces_disid'];
					}
					else {
						var folder = Math.floor(parseInt(object['nces_schid'])/100000);
						var directory = 'tmp/' + folder.toString();
						ncesIdFolder = directory + '/' + object['nces_schid'];

						if(!fs.existsSync(directory)) {

							fs.mkdirSync(directory);
						}
					}

					if(!fs.existsSync(ncesIdFolder)) {
						total++;
						fs.mkdirSync(ncesIdFolder);
					}
					jf.writeFile(ncesIdFolder + '/' + csv.tempFile + '.json', object, function(err) {

				    if(err) {
				        console.log(err);
				    } 
					}); 
				}
			});

			rl.on('close', function() {
				console.log("Finished " + csv.tempFile);
				filesMapped++;
				if(filesMapped === csvs.length) {
					fs.readdir('tmp', function(err,folders) {
						folders.forEach(function(folder) {
							fs.readdir('tmp/' + folder, function(err, schools) {
								var income = {}
								if(fs.existsSync('tmp/' + folder + '/income.json')) {
									try {
										income = jf.readFileSync('tmp/' + folder + '/income.json');
									}
									catch(err) {
										console.log(err);
									}
								}
								schools.forEach(function(school) {
									if(fs.lstatSync('tmp/' + folder + '/' + school).isDirectory()) {
										fs.readdir('tmp/' + folder + '/' + school, function(err, files) {
											var object = {};
											recursiveFileReader(folder, school, files, object, income);
										});
									}
								})
							});
						});
					});
					checkIfDone();
				}
			});
		})
	});
}

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
			_.forEach(wkt, function(coord, index) {
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

function recursiveFileReader(folder, school, files, object, income) {
	var directory = 'tmp/' + folder + '/' + school + '/' + files[0];
	var data = {};
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
		recursiveFileReader(folder, school, files, object, income);
	}
	else {
		object = _.merge(object, income);
		mongoCreate(object);
	}
}

var objects = [];
var inserted = 0;
var inserting = false;
function mongoCreate(object) {
	// objects.push(object);
	// if((objects.length % 1000 === 0) || (total-inserted) < 1000 ) {
		School.create(object, function (err, newSchool) {
			// console.log(JSON.stringify(newSchool));	
			inserted++;
			inserting = true;
	  });
	  // objects = [];
	// }
}

var registeredDone = 0;
function checkIfDone() {
	console.log("inserted: " + inserted + " registeredDone: " + registeredDone );
	if(inserted === registeredDone && inserting) {
		rimraf('tmp', function() {
			console.log("Schools Ingest Complete");
			callback();
		})
	}
	else {
		registeredDone = inserted;
		setTimeout(checkIfDone, 30000);
	}
}