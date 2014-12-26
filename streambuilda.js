
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
			serialize = require('node-serialize')



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



var TaskWait = function(task){

}


//Function for store data 
function Store(){
	var readStorage = '';
}


var readSerializeFuncs = function(dirname){
	var serializeFuncs = {}
	try {
			fs.readdirSync(dirname).map(function(path){
				var loadeddata = fs.readFileSync(dirname + "/" + path, 'utf-8');
				if(loadeddata.length > 0){
					var result = JSON.parse(loadeddata);
					serializeFuncs[result.name] = serialize.unserialize(result);
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
	//var serializeFuncs = readSerializeFuncs("./funcs/");
	readSerializeFuncs('./streambildas')
	var taskNames = {}
	var task_sys = TaskSystem;
	var sys = HeartOfSB('./streambildas');
	return {
		variable: [],
		sysdir: './streambilda',
		log: function(message){
			//Basic log message
			console.log(message)
		},
		read: function(data){
			comm[data.name] = Commands['checkPathsExist'];
		},

		exisis: function(data){
			comm[data.name] = data.action;
		},

		compress: function(data){
			comm[data.name] = Commands['compress']
		}, 
		//user event
		event: function(data){

		},

		//By default is async task
		//Data can be on single task or in list
		//connected - for connected tasks
		task: function(tasktitle, data, connected){
			if(tasktitle != undefined){
				var task_append = {name: tasktitle, connect: connected}
				if(Array.isArray(data)){
					task_append.tasks = data
					var prepare = {name: tasktitle, tasks: data, connect:connected};
					task_sys.tasks(prepare);
					taskNames[tasktitle] = prepare;
				}
				else if('run' in data){
					var prepare = {name: tasktitle, func:data.run, connect:connected}
					task_sys.task(prepare);
					taskNames[tasktitle] = prepare;
				}
				else{
					var prepare = {name: tasktitle, func: Commands.func(data).run, connect: connected};
					task_sys.task(prepare);
					taskNames[tasktitle] = prepare;
				}
			}
		},

		//Append argument for the task;
		args: function(tasktitle, arg){
			if(tasktitle != undefined){
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

		watch: function(path){
			comm[data.name] = Commands['watch']
		}, 

		//Serialization user function to ./funcs
		registerFunction: function(title, func){
			var obj = {
				name: title,
				say: func
			}
			var dirname = './funcs/';
			if(process.platform == 'win')
				dirname = ".\\funcs";
		},

		run: function(data){
			//Remove this part and set all implementation to TaskSystem func.

			/*if(tasks.length > 0){
				tasks.forEach(function(task){
					if(task.length == undefined)
						q.fcall(task.run).then(function(res){
						}).done()
					else{
						task.forEach(function(innertask){
							q.fcall(innertask.run).then(function(res){

							}).done()
						})
					}
				})
			}*/
			//sys.append(taskNames);
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

		}
	}
};

//Serialize user and system data
//Need append hash
var SerializeData = function(dirname, obj, isjson){
	var result = serialize.serialize(obj);
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
}

//Core of each task for each session
//Heart Of StreamBilda
var HeartOfSB = function(path){
	//No need some complex solution, just get from random
	var id = Math.round(Math.random() * 10000000);
	//Create system dir(for this module)
	//console.log(files.lstatSync(path).isDirectory());
	var fullpath = path + "/" + id.toString();
	if(!files.existsSync(path))
		createDir(path);
	if(files.lstatSync(path).isDirectory()){
		files.openSync(fullpath, 'w');
	}
	else{

	}

	return {
		//Append information about tasks
		append: function(data){
			SerializeData(fullpath, data);
		}
	}
};

//Deserizalize objects
var LoadStoredObjects = function(path){
	readSerializeFuncs(path);
}

var createDir = function(dirname){
	mkdirp(dirname, function(e){
		if(e){
			throw "Error in create folder"
		}
	});
};

