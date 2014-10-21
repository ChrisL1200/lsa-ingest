var fs = require('fs');
var _ = require('lodash');
var School = require('./schema');
// First I want to read the file
console.log("Parsing boundary files....");
School.remove({}, function(err) { 
fs.readFile(__dirname + '/data/maponics_sample_us_attendance_zones_wkt.txt', 'utf8', function read(err, data) {
    if (err) {
        throw err;
    }
    var content = data.split('\r\n');
    var insertion = false;
    var keys = [];
    var object = {};
    _.forEach(content, function(val, i) {
    	_.forEach(val.split('|'), function(value, index){
    	if(insertion) {
	    	if(value.split(' ')[0] === "MULTIPOLYGON") {
	    		var latLongs = value.replace('MULTIPOLYGON ', "").replace("(((", "").replace(")))", "").split(", ");
	    		var path = [];
	    		_.forEach(latLongs, function(latLong) {
	    			var splitCoord = latLong.split(" ");
	    			path.push({ latitude: parseFloat(splitCoord[1]), longitude: parseFloat(splitCoord[0])});
	    		});
	    		object[keys[index]] = path;
                object.score = Math.round(Math.random() * 10000)/1000;
                var splitCoord = latLongs[0].split(" ");
                object.coordinates = { latitude: parseFloat(splitCoord[1]), longitude: parseFloat(splitCoord[0])};
				School.create(object, function (err) {
                    if(i >= content.length - 2) {
                        console.log("Finished parsing boundary files");
                        process.exit();
                    }
                });
	    	}
	    	else {
	    		object[keys[index]] = value;	
	    	}
    	}
    	else {
    		keys.push(value);
    	}

    	});
    	insertion = true;
    	object = {};
    })
} );
});
