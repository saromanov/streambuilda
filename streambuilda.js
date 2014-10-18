
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
		}
	}

}


//All tasks run as async
//All events waitings for start
var BuilderAsync = function(){
	var comm = {}
	return {
		log: function(message){
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
		task: function(data){

		},

		watch: function(path){
			comm[data.name] = Commands['watch']
		}, 

		run: function(data){
			if(data.length > 0){
				console.log(data);

			}
		},

		//run data as sequence(every args from last event to next)
		seq: function(data, initval){
			var result = Q(initval)
			data.forEach(function(f){
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
