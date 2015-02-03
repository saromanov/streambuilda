var fs = require('fs')
	q = require('q')
	//https://github.com/paulmillr/chokidar
	chokidar = require('chokidar')
	compressor = require('node-minify')
	nodeunit = require('nodeunit').reporters.default;
	jshint = require('jshint').JSHINT

	//https://github.com/jshint/fixmyjs
	fixmyjs = require('fixmyjs')
	gm = require('gm').subClass({imageMagick:true})
	require('util'),
    spawn = require('child_process').spawn,

    //https://www.npmjs.com/package/clean-css
    CleanCSS = require('clean-css')
    colors = require('colors')
    myth = require('myth')
    _ = require('underscore')
    pathutils = require('path')
    proto = require('protobuf')
    csv = require('csv')
    //https://github.com/isaacs/node-glob
    glob = require('glob')


define(function(req){
	return Commands
});


/*
	Basic body for commands is
	function
	{
		return{
			run()...
		}
	}
*/

var Commands = (function(){

	return {
		/*
		  input: list of paths
		  Return files, which exist
		  Note: Need to remove
		*/ 
		checkPathsExist: function(paths){
			return {
				run: function(){
					if(!Array.isArray(paths))
						paths = [paths];
					var result = paths.filter(function(x){
						return fs.existsSync(x);
					});
					if(result.length == 0)
						return false;
					else
						return true;
				}
			}
		},

		/*
			Compress js file
		*/
		compress: function(data){
			return {
				run: function(){
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
				}
			}
		},

		/*
			path - target path for watching
			action after receipt of event
			typeaction - name of action (change, add, ...)
		*/
		watchChanges: function(path, action, typeaction){
			nameaction = typeaction
			if(typeaction == undefined)
				nameaction = 'change'
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
			return {
				run: function(){
					createDir(folder);
					if(subfolders != undefined)
						subfolders.forEach(function(name){
							createdir(folder + "/" + name);
						});
				}
			}
		},

		//Move target data to another place
		move: function(path, newpath){
			return {
				run: function(){
					if(fs.existsSync(path))
						MoveFile2(path, newpath);
				}
			}
		},

		//Test data
		//path - list of files ot path with files(also as list)
		// But this is not async version
		testing: function(path){
			return {
				//User task 
				run: function(){
					if(typeof path == 'object' && path.length > 0){
						nodeunit.run(path)
						return true
					}
					if (typeof path == 'string'){
						if(fs.existsSync(path)){
							nodeunit.run([path]);
							return true;
						}
					}
					return false;
				}
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
		},

		//Run jshint in async
		jshint: function(paths){
			return {
				run: function(){
					if(typeof paths == 'string'){
						_.each(glob.sync(paths), function(x){JSHint(x);});
					}
					else if(Array.isArray(paths)){
						//Set several paths for jshint
						if(paths.length > 0){
							_.each(paths, function(path){
								_.each(glob.sync(path), function(cpath){
									JSHint(cpath)
								});
							});
						}
					}
					return false;
				}
			}
		},

		//Task with FixMyJS
		fixmyjs: function(paths){
			return {
				run: function(){
					if(typeof paths == 'string'){
						FixMyJSLoader(paths);
					}
					else if(typeof paths == 'object'){
						paths.forEach(function(path){
							FixMyJSLoader(path);
						})
					}
					return false;
				}
			}
		},

		//Image resize
		//paths is dict
		imgresize: function(paths){
			return{
				run: function(){
					var x = paths.resize[0];
					var y = paths.resize[1];
					var gmobject = gm(paths.path)
						.resize(x,y);
						/*.autoOrient()
						.write(paths.outpath, function(err, out, stderr){
							if (err != undefined)
								console.log("Found error in write image", err);
						})*/
					imgGM(paths, gmobject);
				}
			}
		},

		imgrotate: function(paths){
			return{
				run: function(){
					if(paths != undefined){
						console.log("Start task imgrotate".red);
						var gmobject = gm(paths.path)
							.rotate(paths.color, paths.degree);
						imgGM(paths, gmobject);
						FinishedMessage("Finished task imgrotate")
					}
				}
			}
		},

		imgcolor: function(paths){
			return{
				run: function(){
					if(paths != undefined){
						var gmobject = gm(paths.path)
										.colorize(paths.r,paths.g,paths.b)
						imgGM(paths, gmobject);
						return true;
					}
				}
			}
		},

		//Compile livescript to js
		livescript: function(paths){
			return {
				run: function(){
					targetpath = paths
					/*if (typeof paths == 'string') {
						console.log("Start task livescript".red)
						RunShScript('lsc', ['-c', paths]);
						FinishedMessage('Finished task livescript');
						return true;
					}*/

					if(typeof paths != 'string' && Object.keys(paths).length > 0)
						targetpath = paths.path
					files = glob.sync(targetpath);
					_.each(files, function(path){
						RunShScript('lsc', ['-c', path]);
					});
				}
			}
		},


		shell: function(command, args){
			//Run shell commands and scripts
			//command - basic command
			//args - this arguments
			return {
				run: function(){
					console.log("Start task shell".red);
					RunShScript(command, args);
					FinishedMessage('Finished task shell');
				}
			}
		},

		//Output log message
		log: function(message){
			return {
				run: function(){
					console.log("LOG MESSAGE: ".green, message);
				}
			}
		},

		cleancss: function(path, outpath){
			return{
				run: function(){
					console.log("Start task cleancss".red);
					fs.readFile(path, 'utf-8', function(err, data){
						var minimized = new CleanCSS().minify(data);
						if(outpath == undefined){
							outpath = path.split('.')[0] + '_min.css';
						}
						fs.writeFile(outpath, minimized);
						FinishedMessage("Finished task cleancss")
					})
				}
			}
		},

		//user-defined function
		func: function(datafunc){
			return{
				run: function(){
					datafunc();
				}
			}
		},

		//Livereload with module https://github.com/napcs/node-livereload
		livereload: function(path){
			return{
				run: function(){
					livereload = require('livereload');
					server = livereload.createServer();
					server.watch(path);
				}
			}
		},

		myth: function(path, outpath){
			return {
				run: function(){
					//Check exist
					var css = fs.readFileSync(path, 'utf-8');
					var converted = myth(css);
					fs.writeFileSync(outpath, converted);
				}
			}
		},

		csvload: function(path, conf){
			return {
				run: function(){
					var generator = csv.generate(conf);
					var parser = csv.parse();
					var transformer = csv.transform(function(data){
  							return data.map(function(value){return value.toUpperCase()});
					});
					//var stringifier = csv.stringify();

				}
			}
		}

	}
})()


var FixMyJSLoader = function(paths){
	fs.readFile(paths, 'utf-8', function(err, data){
		var src = data.toString();
		jshint(src)
		var stringFixedCode = fixmyjs(jshint.data(), src).run();
		console.log("Code on path: " + paths)
	})
};

var RunShScript = function(command, params){
	//cmd = spawn('ls', ['-lh', '/usr']);
	cmd = spawn(command, params);
	cmd.stdout.on('data', function(data){

	});

	cmd.stderr.on('data', function(data){
		console.log("ERROR: ", data.toString())
	});
};

var FinishedMessage = function(message){
	console.log(message.yellow);
};

var JSHint = function(path){
	var data = fs.readFileSync(path, 'utf-8')
	if(data == undefined)
		return false;
	if(jshint(data.toString())){
		console.log("File " + path + " not contain errors")
		return true;
	}

	jshint.data().errors.forEach(function(errordata){
		if(errordata != null){
			console.log("FILE: " + path)
			console.log(errordata.line + " " + errordata.raw);
		}
	})
};

var createDir = function(dirname){
	mkdirp(dirname, function(e){
		if(e){
			throw "Error in create folder"
		}
	});
};

//Move file from one path to another
var MoveFile = function(path, newpath){
	if(newpath[newpath.length-1] != '/')
		newpath = newpath + '/';
	fs.rename(path, newpath + pathutils.basename(path), function(x){
		if(x != null){
			console.log("Path not found. The new path will be created");
			createDir(newpath);
			//fs.closeSync(fs.openSync(newpath, 'w'));
			MoveFile(path, newpath);					
		}
	});
};


var MoveFile2 = function(path, newpath){
	if(newpath ==undefined){
		console.error("Path or newpath is undefined")
		return;
	}
	fs.rename(path, newpath, function(x){

	});
}

//Manipulating with images with gm module
var imgGM = function(data, gmobject){
	var outpath= data.outpath;
	if(outpath == undefined)
		outpath = data.path
	gmobject
	.autoOrient()
	.write(outpath, function(err, out, stderr){
		if (err != undefined)
				console.log("Found error in write image", err);
	});
};
