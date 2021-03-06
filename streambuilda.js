

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
			_ = require('underscore');



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


var appendToLog = function(logname, info){
	if(logname != undefined){
		fs.appendFile(logname, info, 'utf-8')
	}
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
	var projects = {}
	var outlog = undefined
	if(params != undefined){
		if(params.output != undefined){
			outlog = params.output;
			fs.writeFile(outlog, 'Session is started\n', 'utf-8');
		}

	}
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

				var keys = _.keys(result);
				var build = new BuilderAsync();
				//Unactive now
				var connect=undefined;
				var async = undefined;
				if(keys.length != 0){
					_.each(keys,function(taskname){
						var commands = _.keys(result[taskname]);
						//Tasks will be in list type
						var listoftasks = [];
						_.each(commands,function(command){
							if(command in Commands){
								args = result[taskname][command]
								if(Array.isArray(args))
									listoftasks.push(Commands[command].apply(this, args));
								else
									listoftasks.push(Commands[command](args));
							}
							else if(command == "async"){
								async = true;
							}
							else{
								//Check if this command write as commandA (run in async)
								if(command.slice(-1) == 'A'){
									var clear = command.substr(0, command.length-1);
									if(clear in Commands){
										async = true;
										args = result[taskname][command]
										listoftasks.push(Commands[clear](args));
									}
								}
							}
						});
						build.task(taskname, listoftasks, connect, async);
					})
				};
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
			if(!_.isString(tasktitle)){
				console.error("Title of task, must be in string type");
				return;
			}
			if(!_.isUndefined(tasktitle)){
				var task_append = {name: tasktitle, connect: connected, async: async}
				//Run tasks as sequence
				if(_.isArray(data)){
					task_append.tasks = data
					var prepare = {name: tasktitle, tasks: data, connect:connected, async:async};
					task_sys.tasks(prepare);
					taskNames[tasktitle] = prepare;
				}
				else if(_.isObject(data) && 'run' in data){
					var prepare = {name: tasktitle, func:data.run, connect:connected, async: async}
					task_sys.task(prepare);
					taskNames[tasktitle] = prepare;
				}
				else if(_.isFunction(data)) {
					var prepare = {name: tasktitle, func: Commands.func(data).run, connect: connected, async: async};
					task_sys.task(prepare);
					taskNames[tasktitle] = prepare;
				}
			}
		},

		//Append project name
		projectName: function(name){
			projects[name] = [];
		},

		//After this, run task in async
		//Connected async, run after current task
		taskAsync: function(tasktitle, data, connectedAsync){
			 console.log("THis is data: ", data);
			 this.task(tasktitle, data, undefined, true)
		},


		taskTest: function(tasktitle, func){
			task_sys.test(tasktitle, func);
		},

		//Return current status of task
		taskStatus: function(tasktitle){
			return task_sys.result(tasktitle)
		},

		//Append task from loaded functions
		usertask: function(title){
			if(title in serializeFuncs){
				task_sys.task({name:title, func: Commands.func(serializeFuncs[title].func).run})
			}
		}, 

		taskIfElse: function(taskif, taskelse){
			//If first task(taskif) is failed, run second task(taskelse)
			IfElse.push([taskif, taskelse]);
		},

		//Append argument for the task;
		args: function(tasktitle, arg){
			if(tasktitle != undefined && arg != undefined){
				task_sys.args({name:tasktitle, args:arg})
			}
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

		//Connect to some task(with emits)
		onTask: function(taskname, event, func){
			if(_.isString(taskname) && _.isString(event))
				task_sys.on(taskname + event, func);
		},

		run: function(data){
			var len = Object.keys(projects).length;
			if(len > 0){
				Object.keys(projects).forEach(function(x){
					if(projects[x].length == 0)
						projects[x] = taskNames;
				})
			}
			console.log("Start running of tasks: ", new Date());
			if(IfElse.length > 0){
				_.each(IfElse,function(x){
					if(x.length == 2)
						task_sys.taskIfElse(x[0], x[1]);
				})
			}
			appendToLog(outlog, "Tasks is started");
			task_sys.run(this.outlog,data);
		},
		//run data as sequence(every args from last event to next)
		seq: function(data, initval){
			if(data != undefined && initval != undefined)
				task_sys.runSeq(data, initval);
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
		fs.mkdirSync(path);
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

module.exports = BuilderAsync;