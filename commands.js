var fs = require('fs')
	q = require('q')
	//https://github.com/paulmillr/chokidar
	chokidar = require('chokidar')


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

		writefile: function(path, data){
			fs.writeFileSync(path, data, 'utf-8')
		},

		writefileA: function(path, data){
			q.fcall(fs.writeFile, path, data, 'utf-8').then(function(responce){

			}).done()
		},
		watchChanges: function(path, action){
			var watcher = chokidar.watch('streambuilda.js', {persistent: true});
			watcher.on('change', function(path){
			action == undefined?console.log('File', path, 'has been change'): action(path);
			})
		}

	}
})()