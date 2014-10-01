var fs = require('fs')
	q = require('q')


define(function(req){
	return Commands
});
var Commands = (function(){

	return {
		createdir: function(dirname){
			mkdirp(dirname, function(e){
			if(e){
				throw "Error in create folder"
			}
		   });
		},

		opendir: function(dirname){

		},

		readfile: function(path){
			q.fcall(fs.readFile, path, 'utf-8').then(function(result){
				console.log("THIS IS RES", result);
			}).done()
		},

		readfile: function(path){

		},

		wrirefile: function(path){

		}
	}
})()