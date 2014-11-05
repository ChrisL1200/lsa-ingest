var xml2js = require('xml2js');
var Home = require('./schema');
var _ = require('lodash');
var fs = require('fs');
var https = require('https');

exports.ingest = function() {
	var inserted = 0;
	//Remove old collection
	Home.remove({}, function(err) { 
		var username = 'cruvita';
		var password = 'UbV92it';
		var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

		var options = {
			host: 'feeds.listhub.com',
			path: '/pickup/cruvita/',
			headers: {Authorization: auth} 
		};

		var httpCallback = function(response) {
			var completeResponse = '';
			console.log(response.req);
		    response.on('data', function (chunk, err) {
		    	console.log(err);
		    	console.log(chunk);
		        completeResponse += chunk;
		    });
		    response.on('end', function() {
				// callback(completeResponse);
			});
		};

		https.request(options, httpCallback).end();
		// var parser = new xml2js.Parser();
		// parser.parseString(xml, function(err,results){
		// 	if(err) {
		// 		throw err;
		// 	}
	 //  		//Extract the value from the data element
	 //  		console.log(results);
	 //  		_.each(results['results'].result, function(result) {
		// 		Home.collection.insert(result, function (err) {
		// 			if(err) {
		// 				throw err;
		// 			}
		// 			inserted++;
		// 			if(inserted === results['results'].result.length) {
		// 				console.log("Finished ingesting homes");
		// 				process.exit();
		// 			}
  //           	});
	 //  		});
		// });
	});

}