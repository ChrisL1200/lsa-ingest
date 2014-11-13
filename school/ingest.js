var async = require('async');
var Education = require('./education');
var Boundary = require('./boundary');
var ncesList = [];

exports.ingest = function() {
	Education.ingest('./data/education/universal.csv', 0);
}

exports.addNCES = function(id) {
	ncesList.push(id);
}

exports.removeNCES = function(id) {
	ncesList.splice(ncesList.indexOf(id), 1);
}

exports.containsNCES = function(id) {
	return (ncesList.indexOf(id) !== -1);
}