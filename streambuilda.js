

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
			serialize = require('node-serialize');



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


var Builder2 = function(){
	return {
		log: function(message, func){
			console.log(message);
			if(func != undefined){
				console.log("YES");
			}
		},

		read: function(item){

		},

		run: function(){
			console.log(fast.pop())
		},

		task: function(item){

		}
	}

}

var readSerializeFuncs = function(dirname){
	var serializeFuncs = {}
	try {
			fs.readdirSync(dirname).map(function(path){
			var result = JSON.parse(fs.readFileSync(dirname + path, 'utf-8'));
			serializeFuncs[result.name] = serialize.unserialize(result).say
		});

	}catch(ex){
		return {}
	}
	return serializeFuncs;
}


//All tasks run as async
//All events waitings for start
var BuilderAsync = function(params){
	var serializeFuncs = readSerializeFuncs("./funcs/");
	var tasks = []
	var taskNames = {}
	var task_sys = TaskSystem;
	return {
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
		task: function(tasktitle, data){
			if(tasktitle != undefined){
				tasks.push(data);
				taskNames[tasktitle] = data;
				task_sys.task({name: tasktitle, func:data.run});
			}
		},

		//Append argument for the task;
		args: function(tasktitle, arg){
			if(tasktitle != undefined){

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
			var dirname = './funcs/'
			if(process.platform == 'win')
				dirname = ".\\funcs"
			var result = serialize.serialize(obj);
			fs.exists(dirname, function(ex){
				if(!ex)
					mkdirp(dirname, function(a){})
				console.log("Serialize new function to: ", dirname + title + ".json")
				fs.writeFile(dirname + title + ".json", result, 
					function(res){});
			});
		},

		run: function(data){
			if(tasks.length > 0){
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
			}
		},

		//Experimental run from inner tasks
		runExpr: function(){
			task_sys.run();
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
		}
	}
}


//Load something from internet
//http://nodejs.org/api/http.html
function loadFromNet(path){

}

//Создание файла
function createFile(path){
	return function(){

	};
}
