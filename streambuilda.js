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
	if(name == 'string'){
		return files.readFileSync(name, {encoding: 'utf-8'});
	}
	else
	{
		var result = [];
		for(var n in names){
			result.push(files.readFileSync(name, {encoding: 'utf-8'}));
		}
		return result;
	}
	//console.log('RRR: ' + content);
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


function Builder()
{
	this.fast = new FastList();
}

Builder.prototype = {
	read: function(path){
		this.fast.push([readFile, path]);
	},
	mkdir: function(path, err){
		fast = this.fast;
		mkdirp(path, function(e){
			if(e){
				fast.push([logMessage, message]);
			}
		});
	},
	log: function(message){
		this.fast.push([logMessage, message]);
	},

	//run all events
	run: function(){
		for(var i = 0; i <=this.fast.length;++i){
			var lst = this.fast.pop();
			console.log(lst[0](lst[1]));
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
