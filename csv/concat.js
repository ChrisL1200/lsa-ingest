var _ = require('lodash');
_.mixin(require("lodash-deep"));
var fs = require('fs');
var rimraf = require('rimraf');
var readline = require('readline');
var stream = require('stream');
var jf = require('jsonfile');
var School = require('../school/schema');
var parser = require('wellknown');

var schoolList = [];
var filesMapped = 0;
var finished = false;
var total = 0;
exports.ingest = function() {
	var csvs = [{
		filename: './data/boundary/maponics_sample_us_attendance_zones_wkt.txt',
		boundary: true,
		tempFile: 'boundary'
	},{
		filename: './data/education/universal.csv',
		model: [
			{index:0, key: 'nces_schid'},
			{index:7, key: 'sch_name'},
			{index:22, key:'coordinates.latitude'},
			{index:23, key:'coordinates.longitude'},
			{index:37, key:'freeLunch'},
			{index:38, key:'redLunch'},
			{index:289, key:'stRatio'},
			{index:266, key:'member'},
			{index:31, key:'titleOne'}
		],
		tempFile: 'universal'
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
	var allKeys = [];
	School.remove({}, function(err) { 
		_.each(csvs, function(csv) {
			var instream = fs.createReadStream(csv.filename);
			var outstream = new stream;
			var rl = readline.createInterface(instream, outstream);
			var firstLine = true;
			rl.on('line', function(line) {
				var object = {};
				if(firstLine) {
					keys = line.split('|');
					firstLine = false;
				}
				else {
					if(csv.boundary) {
						object = boundaryParser(line);
					}
					else {
						var columns = line.split(',');
						if(!firstLine) {
							_.each(csv.model, function(item) {
								if(allKeys.indexOf(item.key) === -1) {
									allKeys.push(item.key);
								}
								_.deepSet(object, item.key, columns[item.index]);
							});
						}
						else {
							firstLine = false;
						}
					}

					var folder = parseInt(object['nces_schid']) % 10000;
					var directory = 'tmp/' + folder.toString();

					if(!fs.existsSync(directory)) {

						fs.mkdirSync(directory);
					}

					var ncesIdFolder = directory + '/' + object['nces_schid'];
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
								schools.forEach(function(school) {
									fs.readdir('tmp/' + folder + '/' + school, function(err, files) {
										var object = {};
										recursiveFileReader(folder, school, files, object);
									});
								})
							});
						});
					});
				}
			});
		})
	});
}

function boundaryParser(line, firstLine) {
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

function recursiveFileReader(folder, school, files, object) {
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
		recursiveFileReader(folder, school, files, object);
	}
	else {
		mongoCreate(object);
	}
}

var objects = [];
var inserted = 0;
function mongoCreate(object) {
	// objects.push(object);
	// if((objects.length % 1000 === 0) || (total-inserted) < 1000 ) {
		School.create(object, function (err, newSchool) {
			inserted++;
			if(total === inserted) {
				rimraf('tmp', function() {
					process.exit();
				})
			}
	  });
	  // objects = [];
	// }
}