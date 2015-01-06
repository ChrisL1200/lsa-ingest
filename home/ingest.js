var parseString = require('xml2js').parseString;
var request = require('request');
var Home = require('./schema');
var _ = require('lodash');
var zlib = require('zlib');
var Photo = require('../photos/ingest');
var callback;
var inserted = 0;
var finished = false;
var registeredDone = 0;
var startDate;

function checkIfDone() {
	console.log(inserted + ', ' + registeredDone);
	if(inserted === registeredDone && finished) {
		console.log("Homes Ingest Complete");
		Photo.ingest(startDate);
		// callback();
	}
	else {
		registeredDone = inserted;
		setTimeout(checkIfDone, 30000);
	}
}

function reformat(home) {
	if(home.listing.address) {
		home.listing.address = home.listing.address[0];
		home.listing.address.city = home.listing.address.city ? home.listing.address.city[0] : undefined;
		home.listing.address.stateorprovince = home.listing.address.stateorprovince ? home.listing.address.stateorprovince[0] : undefined;
		home.listing.address.postalcode = home.listing.address.postalcode ? home.listing.address.postalcode[0] : undefined;
	}
	if(home.listing.location) {
		home.listing.location = home.listing.location[0];
		home.listing.location.latitude = home.listing.location.latitude ? home.listing.location.latitude[0] : undefined;
		home.listing.location.longitude = home.listing.location.longitude ? home.listing.location.longitude[0] : undefined;
	}
}

exports.ingest = function(async) {
	startDate = new Date();
	callback = async;
	console.log('Ingesting Homes...');
	checkIfDone();
	var options = {
	  url : "https://feeds.listhub.com/pickup/cruvita/cruvita.xml.gz",
	  auth: {
	  	user: 'cruvita',
	  	pass: 'UbV92it'
	  },
	  headers: {
		  "accept-charset" : "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
		  "accept-language" : "en-US,en;q=0.8",
		  "accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		  "user-agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2",
		  "accept-encoding" : "gzip,deflate",
		}
	};
	var saxStream = require("sax").createStream(false, {lowercasetags:true, trim:true});
	saxStream.on("error", function (e) {
	  console.error("error!", e);
	  this._parser.error = null;
	  this._parser.resume();
	});

	var listing = null;
	var ingested = 0;
	saxStream.on("opentag", function (tag) {
		if (tag.name !== "listing" && !listing) {
			return;
		}
		if(tag.name === "listing") {
			if(listing) {
		  	parseString(listing, function (err, result) {
					if(err) {
						// console.log(listing)
						// console.log("XML CONVERSION ERROR:");
						console.log(err);
					} 
		  		if(result) {
	  				reformat(result);
		  			ingested++;
		  			Home.findOne()
		  			.where('listing.listingkey').equals(result.listing.listingkey[0])
		  			.exec(function(err,home){
		  				if(err) {
		  					console.log(err);
		  				}
		  				if(home) {
		  					if(new Date(result.listing.modificationtimestamp[0]).getTime() > home.listing.modificationtimestamp[0].getTime()) {
			  					home = _.assign(home,result);
			  					home.ingestDate = new Date();
			  					home.save(function(err) {
			  						if(err) {
			  							console.log(err);
			  						}
									  inserted++;
			  					});
			  				}
			  				else {
			  					inserted++;
			  				}
		  				}
		  				else {
		  					result.ingestDate = new Date();
								Home.create(result, function (err) {
									if(err) {
										console.log(err);
									} 
								  inserted++;
				        });
		  				}
		  			});
	       	}
				});
		  }
			listing = '';
		}
		listing += '<' + escape(tag.name.replace('commons:','').replace('-','')) + '>';
	});

	saxStream.on("text", function (text) {
	  listing += text.replace(/[\n\r]/g, '\\n').replace(/&/g,"&amp;").replace(/-/g,"&#45;").replace('<','&lt;').replace('>','&gt;');
	});

	saxStream.on("error", function(err) {
		console.log(err);
	});

	saxStream.on("closetag", function (tagName) {
	  listing += '</' + escape(tagName.replace('commons:','').replace('-','')) + '>';
	});

	var compressedRequest = function(options, outStream) {
	  var req = request(options);
	 
	  req.on('response', function (res) {
	    if (res.statusCode !== 200) {
	    	throw new Error('Status not 200');
	    }
	    var encoding = res.headers['content-type'];
	    if (encoding === 'application/x-gzip') {
	      res.pipe(zlib.createGunzip()).pipe(outStream);
	    } else if (encoding === 'deflate') {
	      res.pipe(zlib.createInflate()).pipe(outStream);
	    } else {
	      res.pipe(outStream);
	    }
	  });
	 
	  req.on('error', function(err) {
	    console.log(err);
	  });

	  req.on('end', function() {
	  	finished = true;
	  });
	};
	 
	compressedRequest(options, saxStream);
};
