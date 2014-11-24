var Education = require('./education');
var Boundary = require('./boundary');
var ncesList = [];

exports.ingest = function(callback) {
  Education.ingest([{
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
		]
	},
	{
		filename: './data/education/reading.csv',
		model: [
			{index:4, key: 'nces_schid'},
			{index:7, key: 'allReading'}
		]
	}, {
		filename: './data/education/math.csv',
		model: [
			{index:4, key: 'nces_schid'},
			{index:7, key: 'allMath'}
		]
	}], callback);
}

exports.addNCES = function(id) {
	ncesList.push(ncesList);
}

exports.removeNCES = function(id) {
	ncesList.splice(ncesList.indexOf(id), 1);
}

exports.containsNCES = function(id) {
	return (ncesList.indexOf(id) !== -1);
}