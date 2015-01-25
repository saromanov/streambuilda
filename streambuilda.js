

files = require('fs');
http = require('http');
//https://www.npmjs.org/package/fast-list
var FastList = require('fast-list');
var Parallel = require('paralleljs');
//https://github.com/codemix/fast.js
var fastjs = require('fast.js');
//https://github.com/substack/node-mkdirp
			mkdirp = require('mkdirp');
			Promise = require('bluebird');
			requirejs = require('requirejs')
			chokidar = require('chokidar')
			//https://github.com/nebulade/supererror
			require('supererror')
			Q = require('q')
			//https://www.npmjs.org/package/node-serialize
			//serialize = require('node-serialize')
			serialize = require('funcster')
			//https://www.npmjs.com/package/protobuf
			Schema= require('protobuf').Schema
			validator = require('validator')
			glob = require('glob');



requirejs.config({
baseUrl: __dirname,
nodeRequire: require
});

var TaskSystem = requirejs('./tasks');
var Commands = requirejs('./commands')



function readFileHelpful(name){
	try{
		return files.readFileSync(name, {encoding: 'utf-8'});
	}catch(e){
		return 'error';
	}
}


//Read all files in dir
function readAllFiles(path){
	try
	{
		var data = files.readdirSync(path);
		return readFile(data);
	}catch(e){
		console.error();
		return "error";
	}
}



function logMessage(message){
	return message;
}


function loadModules(modules){
	var result = [];
	for(var m in modules){
		try
		{
			var data = require(modules[m]);
			result.push(data);
		}catch(err){
			//DO something
		}
	}
	return result;
}


function createData(data){
	var f = data['files'];
	for(var i = 0;i < f.length;++i)
		writeFile(f[i],'');
	var d = data['dirs'];
	for(var i = 0;i < d.length;++i){
		files.mkdir(d[i], files.EEXIST);
	}
}

//Serialize user and system data
//Need append hash
var SerializeData = function(dirname, obj, isjson){
	var result = serialize.deepSerialize(obj);
	console.log(serialize.deepDeserialize(result, {
		globals: {console: console, message:"A"}
	}).tasks[0].run());
	fs.exists(dirname, function(ex){
		if(!ex)
			mkdirp(dirname, function(a){});
		var path = dirname + ".json";
		if(isjson == undefined)
			path = dirname;
		//console.log("Serialize new function to: ", dirname + title + ".json")
		fs.writeFile(path, result, 
			function(res){});
	});
};


var readSerializeFuncs = function(dirname){
	var serializeFuncs = {}
	try {
		 if(fs.existsSync(dirname))
			fs.readdirSync(dirname).map(function(path){
				var fullpath = dirname + "/" + path;
				var loadeddata = fs.readFileSync(dirname + "/" + path, 'utf-8');
				if(loadeddata.length > 0){
					var result = JSON.parse(loadeddata);
					serializeFuncs[result.name] = serialize.deepDeserialize(result);
					//console.log(serializeFuncs[result.name])
				}
			});

	}catch(ex){
		console.log(ex);
		return {}
	}
	return serializeFuncs;
}


//All tasks run as async
//All events waitings for start
var BuilderAsync = function(params){
	var serializeFuncs = readSerializeFuncs("./funcs/");
	var taskNames = {};
	//If-Else tasks
	var IfElse = [];
	var task_sys = TaskSystem;
	var sys = HeartOfSB('./streambildas');
	return {
		variable: [],
		sysdir: './streambilda',
		log: function(message){
			//Basic log message
			console.log(message)
		},

		//Load protobuf configuration file (in development)
		configure: function(path){
			var ob = { num: 42 };
			var schema = new Schema(fs.readFileSync(path));
			var buffer = schema['config.Configuration'];
			buffer.parse(fs.readFileSync('./buftest.proto'))
			//console.log(buffer.parse(buffer.serialize(rec_data)))
		},

		//Load configure from JSON file
		configureRun: function(jsonpath){
			if(fs.existsSync(jsonpath)){
				var readJSONLike = fs.readFileSync(jsonpath);
				//Check if readed readJSONLike is valid json
				if(!validator.isJSON(readJSONLike))
				{
					console.error("This file not contain valid json information");
					return;
				}
				var result = JSON.parse(readJSONLike);
				var keys = Object.keys(result);
				var build = new BuilderAsync();
				if(keys.length != 0){
					keys.forEach(function(taskname){
						var commands = Object.keys(result[taskname]);
						//Tasks will be in list type
						var listoftasks = [];
						commands.forEach(function(command){
							if(command in Commands){
								args = result[taskname][command]
								if(Array.isArray(args))
									listoftasks.push(Commands[command].apply(this, args));
								else
									listoftasks.push(Commands[command](args));
							}
						});
						build.task(taskname, listoftasks)
					})
				}
				build.run();
			}
		},

		//By default is async task
		//Data can be on single task or in list
		//connected - for connected tasks
		task: function(tasktitle, data, connected, async){
			//Check connected type
			if(connected != undefined){
				var checkconn = connected.filter(function(x){ return typeof x != 'string';});
				if(checkconn.length > 0)
				{
					console.error("One of type from connecte type if not string. All tasks will be simple");
					connected = undefined;
				}
			}
			if(tasktitle != undefined){
				var task_append = {name: tasktitle, connect: connected, async: async}
				//Run tasks as sequence
				if(Array.isArray(data)){
					task_append.tasks = data
					var prepare = {name: tasktitle, tasks: data, connect:connected, async:async};
					task_sys.tasks(prepare);
					taskNames[tasktitle] = prepare;
				}
				else if('run' in data){
					var prepare = {name: tasktitle, func:data.run, connect:connected, async: async}
					task_sys.task(prepare);
					taskNames[tasktitle] = prepare;
				}
				else{
					var prepare = {name: tasktitle, func: Commands.func(data).run, connect: connected, async: async};
					task_sys.task(prepare);
					taskNames[tasktitle] = prepare;
				}
			}
		},

		//After this, run task in async
		taskAsync: function(tasktitle, data){
			 this.task(tasktitle, data, undefined, true)
			/*if(Array.isArray(data)){
				var prepare = {name:tasktitle, tasks:data, async: true};
				task_sys.tasks(prepare);
			}

			else if('run' in data){
				var prepare = {name: tasktitle, func: data.run, async: true};
				task_sys.task(prepare);
			}*/
		},


		//Append task from loaded functions
		usertask: function(title){
			if(title in serializeFuncs){
				task_sys.task({name:title, func: Commands.func(serializeFuncs[title].func).run})
			}
		}, 

		taskIfElse: function(taskif, taskelse){
			IfElse.push([taskif, taskelse]);
		},

		//Append argument for the task;
		args: function(tasktitle, arg){
			if(tasktitle != undefined && arg != undefined){
				task_sys.args({name:tasktitle, args:arg})
			}
		},

		taskAll: function(taslist){
			//run if all tests is correct

		},

		//Run tasks with TaskSystem;
		tasks: function(name, data, connect){
			var tsystem = TaskSystem;
			var store = {'name':name, 'func': data};
			if(connect != undefined){
				if(typeof connect == 'string')
					store['connect'] = [connect];
				else
					store['connect'] = connect;
			}
			tsystem.task(store);
		},

		//Serialization user function to ./funcs
		//Note: Serialization without global objects
		registerFunction: function(title, func){
			var obj = {
				name: title,
				func: func
			}
			var dirname = './funcs/';
			if(process.platform == 'win')
				dirname = ".\\funcs";
			var result = serialize.deepSerialize(obj);
			fs.writeFileSync(dirname + title, JSON.stringify(result));

		},

		//Serialize task (This task may be use in future)
		//Experimental
		saveTask: function(taskname){
			if(taskname in taskNames){
				SerializeData(taskname, taskNames[taskname]);
				var result = readSerializeFuncs(taskname);
				console.log(result);
			}
		},

		run: function(data){
			//sys.append(taskNames);
			console.log("Start running tasks: ", new Date());
			if(IfElse.length > 0){
				IfElse.forEach(function(x){
					if(x.length == 2)
						task_sys.taskIfElse(x[0], x[1]);
				})
			}
			task_sys.run(data);
		},
		//run data as sequence(every args from last event to next)
		seq: function(data, initval){
			var result = Q(initval)
			data.forEach(function(f){
				if (f in serializeFuncs)
					result = result.then(serializeFuncs[f]);
			    else
					result = result.then(comm[f]);
			})
		},

		//Store current session
		saveSession: function(name){

		},

		//Return info about current tasks (type of tasks)
		info: function(){
			return task_sys.info();
		}
	}
};


var SerializeSystemData = function(path, obj){
	var result = serialize.deepSerialize(HeartOfSB);
	var out = serialize.deepDeserialize(result);
	fs.exists(path, function(ex){
		fs.writeFile(path, result, function(res){});
	});
};

//Core of each task for each session
//Heart Of StreamBilda
var HeartOfSB = function(path){
	var fs = require('fs');
	//No need some complex solution, just get from random
	var id = Math.round(Math.random() * 10000000);
	//Create system dir(for this module)
	//console.log(files.lstatSync(path).isDirectory());
	var fullpath = path + "/" + id.toString();
	if(!fs.existsSync(path))
		createDir(path);
	/*if(files.lstatSync(path).isDirectory()){
		files.openSync(fullpath, 'w');
	}*/
	else{
		
	}

	return {
		//Append information about tasks
		append: function(data){
			SerializeSystemData(fullpath, data);
		}
	}
};

//Deserizalize objects
var LoadStoredObjects = function(path){
	readSerializeFuncs(path);
}

var createDir = function(dirname){
	fs.mkdirSync(dirname);
};
