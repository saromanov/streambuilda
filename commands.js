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

		readfile: function(path){
			return {
				run: function(){
					return fs.readFileSync(path, 'utf-8')
				}
			}
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
						fs.readFile(paths, 'utf-8', function(err, data){
							if(data == undefined)
								return false;
							if(jshint(data.toString())){
								console.log("File " + paths + " not contain errors")
								return true;
							}

							jshint.data().errors.forEach(function(errordata){
								if(errordata != null){
									console.log("FILE: " + paths)
									console.log(errordata.line + " " + errordata.raw);
								}
							})
						})
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

		//Manipulating with images(resize)
		img: function(paths){
			return{
				run: function(){
					gm(paths)
						.resize(25,25)
						.autoOrient()
						.write(paths, function(err, out, stderr){
							if (err != undefined)
								console.log("Found error in write image", err);
						})
				}
			}
		},

		//Compile livescript to js
		livescript: function(paths){
			return {
				run: function(){
					console.log("Start task livescript".red)
					RunShScript('lsc', ['-c', paths]);
					FinishedMessage('Finished task livescript')
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
}

var RunShScript = function(command, params){
	//cmd = spawn('ls', ['-lh', '/usr']);
	cmd = spawn(command, params);
	cmd.stdout.on('data', function(data){

	});

	cmd.stderr.on('data', function(data){
		console.log("ERROR: ", data.toString())
	});
}

var FinishedMessage = function(message){
	console.log(message.yellow);
}