var Education = require('./education');
var mongoose = require('mongoose');

exports.ingest = function() {
	mongoose.plugin(require('mongoose-write-stream'));
	Education.ingest('./data/education/universal.csv', 0);
}