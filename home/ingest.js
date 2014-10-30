var xml2js = require('xml2js');
var Home = require('./schema');
var _ = require('lodash');

exports.ingest = function() {
	var inserted = 0;
	//Remove old collection
	Home.remove({}, function(err) { 
		//Read in File
			//Parse XML File
			var xml = "<results><result><price>150000</price><address>abc</address></result><result><price>250000</price><address>def</address></result></results>";
			var extractedData = "";
			var parser = new xml2js.Parser();
			parser.parseString(xml, function(err,results){
		  		//Extract the value from the data element
		  		_.each(results['results'].result, function(result) {
					Home.collection.insert(result, function (err) {
						if(err) {
							throw err;
						}
						inserted++;
						if(inserted === results['results'].result.length) {
							console.log("Finished ingesting homes");
							process.exit();
						}
	            	});
		  		});
			});
	});

}