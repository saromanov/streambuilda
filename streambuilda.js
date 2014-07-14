
files = require('fs');
http = require('http');

//https://www.npmjs.org/package/fast-list
var FastList = require('fast-list');
var Parallel = require('paralleljs');
//https://github.com/codemix/fast.js
var fastjs =  require('fast.js');
	//https://github.com/substack/node-mkdirp
	mkdirp = require('mkdirp');
//var gdracula = require('graphdracula')
function Task(){
 var tasks={};
}

Task.prototype.add_task = function(){
	if(arguments.length > 0){
		tasks[arguments[0]] = arguments[1];
	}
};


//Граф для задач
function GraphTask(){

}

//Очередь в виде графа (с нодами)
function GraphQueue(){

}


//Чтение файла
function readFile(name){
	if(typeof name == 'string'){
		return readFileHelpful(name);
	}
	else
	{
		var result = '';
		for(var n in name){
			value = readFileHelpful(name[n]);
			if(value != 'error'){
				result += value + '\n';
			}
		}
		return result;
	}
}


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
		return "error";
	}
}

function logMessage(message){
	return message;
}

function readFileAsync(name){
	var content = 'a';
	files.readFileSync(name, {encoding: 'utf-8'}, function(err, data){
		if(err)
			console.log("Something error");
		else{
			console.log('VALUE: ' + content);
			content = data.toString();
		}
	});
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

function writeFile(path, data){
	files.writeFile(path, data, function(err){
		if(err)console.log(err);
	});
}


function Response(data, name, action){
	return {"action":action, "time":new Date(), "result": data[0](data[1]), 
		   "path": data[1],
		   "name": name, 'type':'response'};
}

function Action(action, path, name){
	return {'type':'action', "func": action, "path": path, "time":new Date(), 'name':name}
}


//Function for store data 
function Store(){
	var readStorage = '';
}

function Builder(name)
{
	this.named = name
	if(this.named == undefined)
		this.named = "default";
	this.fast = new FastList();
}

Builder.prototype = {
	/*
		read data for several ways:
		read('path.js') => set in storage data from path.js
		read(['path1.js', 'path2.js']) => merge data from two files
		read('.') => read all files in dir
	*/

	create: function(data){
		var f = data['files'];
		for(var i = 0;i < f.length;++i)
			writeFile(f[i],'');
		var d = data['dirs'];
		for(var i = 0;i < d.length;++i){
			files.mkdir(d[i], files.EEXIST);
		}
	},

	read: function(path){
		if(path[path.length-1] == '.')
			this.fast.push(Response([readAllFiles, path], this.named, 'read'));
		else
			this.fast.push(Response([readFile, path], this.named, 'read'));
	},

	mkdir: function(path, err){
		fast = this.fast;
		mkdirp(path, function(e){
			if(e){
				this.fast.push([logMessage, message], this.named, 'create folders');
			}
		});
	},

	//action with loaded data
	action: function(func){
		this.fast.push(Action(func, this.named, 'action'));
	},


	/*
		Write simple log message
		log("message") => >message
	*/

	log: function(message){
		this.fast.push(Response([logMessage, message], this.named, 'log message'));
	},

	//List of modules
	modules: function(lmodules){
		this.fast.push(Response([loadModules, lmodules], this.named, 'load modules'));
	},

	//TODO:Compine two js files;
	links: function(files){

	},

	//TODO:Check run files

	write: function(path){
		this.fast.push(Action(writeFile, path, this.named));
	},

	//run all events
	run: function(){
		var store = new Store();
		var queue = new FastList();
		for(var i = 0; i <=this.fast.length;++i){
			var lst = this.fast.shift();
			if(lst['type'] == 'response')
			{
					if(lst['action'] == 'read'){
						queue.push(lst['result']);
					}
			}
			if(lst['type'] == 'action')
			{
				lst['func'](lst['path'], queue.pop());
			}
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
