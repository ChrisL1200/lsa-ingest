var parseString = require('xml2js').parseString;
var request = require('request');
var Home = require('./schema');
var _ = require('lodash');
var zlib = require('zlib');

exports.ingest = function() {
	//Remove old collection
	Home.remove({}, function(err) { 
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
		}
		var saxStream = require("sax").createStream(false, {lowercasetags:true, trim:true})
		saxStream.on("error", function (e) {
		  console.error("error!", e);
		  this._parser.error = null;
		  this._parser.resume();
		});

		var listing = null;

		saxStream.on("opentag", function (tag) {
			if (tag.name !== "listing" && !listing) return
			if(tag.name === "listing") {
				if(listing) {
 					//Convert to JSON
			  	parseString(listing, function (err, result) {
			  		if(result) {
							Home.collection.insert(result, function (err) {
								if(err) {
									throw err;
								}
								console.log("Home record created");
			        });
		       	}
					});
			  }
				listing = '';
			}
			listing += '<' + tag.name + '>';
		});

		saxStream.on("text", function (text) {
		  listing += text;
		});

		saxStream.on("closetag", function (tagName) {
		  listing += '</' + tagName + '>';
		});

		var compressedRequest = function(options, outStream) {
		  var req = request(options)
		 
		  req.on('response', function (res) {
		    if (res.statusCode !== 200) throw new Error('Status not 200')
		 
		    var encoding = res.headers['content-type'];
		    if (encoding == 'application/x-gzip') {
		      res.pipe(zlib.createGunzip()).pipe(outStream)
		    } else if (encoding == 'deflate') {
		      res.pipe(zlib.createInflate()).pipe(outStream)
		    } else {
		      res.pipe(outStream)
		    }
		  });
		 
		  req.on('error', function(err) {
		    throw err;
		  })
		}
		 
		compressedRequest(options, saxStream);
	});

}