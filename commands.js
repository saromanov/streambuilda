var fs = require('fs')
	q = require('q')
	//https://github.com/paulmillr/chokidar
	chokidar = require('chokidar')
	compressor = require('node-minify')
	nodeunit = require('nodeunit').reporters.default;


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
				console.log(result);
			}).done()
		},
		/*
		  input: list of paths
		  Return files, which exist
		*/ 
		checkPathsExist: function(paths){
			return paths.filter(function(x){
				return fs.exists.Sync(x);
			})
		},

		compress: function(data){
			var getfilename = function(item){
				if(typeof item == 'string')
					return item;
				else if(typeof item == 'object' && item.length > 0)
					return item[0];

			}
			new compressor.minify({
    			type: 'gcc',
    			fileIn: data,
    			fileOut: getfilename(data) + 'min-gcc.js',
    			callback: function(err, min){
        		 //console.log(err);
    			}
			});
		},

		readfile: function(path){
			return fs.readFileSync(path, 'utf-8')
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
			watcher.close()
		},

		//Create folders and subfolders
		/*
			folders("B", ["C","D"])
		*/
		folders: function(folder, subfolders){
			createdir(folder);
			subfolders.forEach(function(name){
				createdir(folder + "/" + name);
			});
		},

		createdir: function(dirname){
			mkdirp(dirname, function(e){
			if(e){
				throw "Error in create folder"
			}
			});
		},

		//Test data
		//path - list of files ot path with files(also as list)
		testing: function(path){
			if(typeof path == 'object' && path.length > 0)
				nodeunit.run(path)
			if (typeof path == 'string'){
				fs.exists(path, function(resp){
					if(!resp)
						console.log("Error: " + path + " not exist");
					else{
						nodeunit.run([path])
					}
				})
			}
		},

		//join paths in file in one file
		join: function(paths, target){
			if(paths.length > 0){
				paths.map(function(path){
					q.fcall(fs.readFile, path).then(function(data, value){
						console.log(data)
					}).done()
				})
			}
		}

	}
})()