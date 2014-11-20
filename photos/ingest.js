var _ = require('lodash');
var Home = require('../home/schema');
var request = require('request');
// request.debug = true;
var async = require('async');
var fs = require('graceful-fs');
var urls = [];
var lastRunDate = new Date(0);
var imageRequest = request.defaults({
  encoding: null, pool: {maxSockets: Infinity}
});
var started = false;
var firstOne = true;
var homes = 0;
exports.ingest = function() {
	var stream = Home.find().stream();
	stream.on('data', function (result) {
		homes++;
		if(result && result.listing.photos[0]) {
			firstOne = false;
			_.each(result.listing.photos[0].photo, function(photo){
				var id = 'xxx/xxx/4xx/yxxx/xxxx'.replace(/[xy]/g, function(c) {
			    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			    return v.toString(16);
				});
				var checkDirectory = id.split('/');
				_.each([[0],[0,1],[0,1,2],[0,1,2,3]], function(dirs) {
					var directory = 'images/';
					_.each(dirs, function(dir, index) {
						directory += checkDirectory[dir];
						if(index !== (dirs.length - 1)) {
							directory += '/';
						}
					});
					if (!fs.existsSync(directory)){
					    fs.mkdirSync(directory);
					}
				});
				var ws = fs.createWriteStream('images/' + id + '.jpeg');
				// console.log(photo.mediaurl[0]);
				request.get(photo.mediaurl[0])
				.on('error', function(err) {
			    console.log(err)
			  })
				.pipe(ws);
				ws.on('finish', function(){
					
								console.log("Got one!");
								// callback();
				});

					// urls.push(photo.mediaurl[0]);
				});
			  // console.log(urls.length);
			  // console.log(homes);
				// if(urls.length > 50 || started) {
				// 	started = true;
				// }			
		}
	}).on('error', function (err) {
	  console.log(err);
	}).on('close', function () {
		console.log('Finished');
		console.log(urls.length);
		async.eachLimit(urls, 20, function(url, callback){
			// var id = 'xxx/xxx/4xx/yxxx/xxxx'.replace(/[xy]/g, function(c) {
			//     var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			//     return v.toString(16);
			// });
			// var checkDirectory = id.split('/');
			// _.each([[0],[0,1],[0,1,2],[0,1,2,3]], function(dirs) {
			// 	var directory = 'images/';
			// 	_.each(dirs, function(dir, index) {
			// 		directory += checkDirectory[dir];
			// 		if(index !== (dirs.length - 1)) {
			// 			directory += '/';
			// 		}
			// 	});
			// 	if (!fs.existsSync(directory)){
			// 	    fs.mkdirSync(directory);
			// 	}
			// });
			// console.log(urls.length);
			// var ws = fs.createWriteStream('images/' + id + '.jpeg');
			// request(url).pipe(fs.createWriteStream('doodle.png'));
			// ws.on('close', function(){

			// 				console.log("Got one!");
			// 				callback();
			// })
			// request(url, 
			// 	function (error, response, body) {
			//     if (!error && response.statusCode == 200) {
			// 			console.log("WOOP WOOP");
			// 			console.log(url);
		 //        body = new Buffer(body, 'binary');
		 //        var wstream = fs.createWriteStream('images/' + id + '.jpeg');
			// 			wstream.write(body);
			// 			wstream.on('error', function(err){
			// 				console.log(err);
			// 			});
			// 			wstream.on('finish', function(err){
			// 				console.log("Got one!");
			// 				callback();
			// 			});
			// 		}
			// 	})
		} , function(err){
		    // if any of the saves produced an error, err would equal that error
		});
	});
}