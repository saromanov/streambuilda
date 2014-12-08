var async = require('async')
	fs = require('fs')
	comm = require('commands')
	Q = require('q')
	

//http://underscorejs.ru/
var _ = require('underscore')

//Check https://www.promisejs.org/

define(function(req){
	return TaskSystem;
});

//Data is dict object
var filter1 = function(data, key, value){
	return Object.keys(data).filter(function(x){
		return data[x][key] == value});
}

function EmptyTaskException(message) {
   this.message = message;
   this.name = "EmptyListException";
}

function SomethingException(message){
	this.message = message
	this.name = "SomethingWentWrongException";
}

var TaskGraph = function(){
	var graph = {};
	return {
		set: function(data){
			if(data.name != undefined){
				var argum = data.args;
				if(typeof argum != 'object')
					argum = [argum];
				var append = {name: data.name, func: data.func, result:undefined, type:'single', 
								args: argum, async:data.async};
				graph[data.name] = append;
			}
		},
		//Also, with arguments with tasks
		//name is parent
		setParents: function(array){
			/*if(array.argsfrom == undefined)
				throw "Not found argsfrom param"*/
			//if(array.args != undefined){
				graph[array.name] = {'count': Object.keys(array).length, 'type': 'complex', 
			'nodes': array.tasks, 'args': undefined, 'argsfrom':[array.argsfrom], 'func': array['func'],
			'constraints': array.constraints};
			//}
		},

		_getNodes: function(nodes){
			var obj = [];
			nodes.forEach(function(x){
				obj[x] = graph[x];
			});
			return obj;
		},
		get: function(node){
			if(_.has(graph,node))
				return graph[node];
		},
		data: function(){ return graph;},

		getComplexNodes: function(){
			return filter1(graph, 'type', 'complex');
		},

		getSingleNodes: function(){
			return filter1(graph, 'type', 'single');
		},

		//Update node. For Ex: Set in result value (but not for async)
		update: function(node, type, value){
			if(node in graph){
				var cnode = graph[node]
				cnode[type] = value;
				graph[node] = cnode;
			}
		},

		//Update for async nodes
		updateAsync: function(node, type, value){

		}
	}
}


/*Task system looks like a factor graph, but without probability
	
*/

var TaskSystem = (function(){
	var gr = new TaskGraph();
	//Reserved commands(as functions)
	var commands = ['opendir', 'writefile', 'readfile', 'createdir'];
	return {

		/* Append new task. Task can be on two types: Single or parent.
		arguments for task:
		name - title of task
		func - current function for task
		commands from reserved list
		argsfrom - results from past tasks
		connect - connect with other tasks
		*/

		//TODO: Append inner tasks
		task: function(){
			var args = Array.prototype.slice.call(arguments, 0)[0];
			var parnodes = args.connect;
			var keys = Object.keys(args);
			if(!_.isEmpty(parnodes)){
				gr.setParents({'tasks': parnodes, 'name': args.name, 'argsfrom': args.argsfrom,
								'func': args.func, constraints:args.constraints});
			}
			else{
				var data = {name: args.name, async:args.async, 'args':args.args};
				var commidx = commands.indexOf(args.func);
				if(commidx != -1){
					data = _.extend(data, {func: comm[commands[commidx]]})
				}
				else
					data = _.extend(data, {func: args.func});
				if(data.func == undefined){
					message = "Something Went Wrong and function in task '" + data.name + "' is undefined"
					throw new SomethingException(message);
				}
				gr.set(data);
			}
		},

		//Append arguments
		/*
			task.args(taskname, arguments)
			arguments in list
			option param
			argumets in the list format
		*/
		args: function(name){
			if(name != undefined)
				gr.update(name.name, 'args', name.args);
			var argsfrom = name.argsfrom;
			if(argsfrom != undefined)
				gr.update(name, 'argsfrom', argsfrom)
		},

		run: function(){

			//Not for async events
			var graph = gr;
			var startnode = arguments[0];
			var complexNodes = graph.getComplexNodes();
			//Get "simple nodes" without parents
			if(_.isEmpty(complexNodes)){
				//Case without a complex nodes
				singleNodes = graph.getSingleNodes();
				_.each(singleNodes, function(x){
					sgraph = graph.get(x);
					if(sgraph.async){
						Q.fcall(sgraph.func, sgraph.args).then(function(result){
							graph.update(x, 'result', result);
						}).done();
					}
					else{
						if(sgraph.args == undefined){
							message = "Something Went Wrong and arguments in task '" + sgraph.name + "' is undefined"
							throw new SomethingException(message);
						}
						graph.update(x, 'result', sgraph.func.apply(this, sgraph.args));
					}
				});
				//throw new EmptyTaskException('This node has no tasks');
			}else {
			//lookup nodes with childrens
			complexNodes.forEach(function(x){
				var nodes = graph.get(x)['nodes'];
				//console.log(_.all(function(x){ return graphget(x).result != undefined;}, nodes))
				nodes.forEach(function(y){
					var singlenode = graph.get(y);
					if(singlenode != undefined){
						var result = singlenode.func.apply(this, singlenode.args);
						//console.log(nodes)
						//TODO: Weak place(Need async solution)

						//Now constraints only for numbers
						var constraints = graph.get(x).constraints;
						if(_.isUndefined(constraints) == false){
							var keys = Object.keys(constraints)
							if(keys.indexOf(y) != -1){
								if(_.isObject(constraints[y])){
									var data = constraints[y];
									if(result >= data.min && result <= data.max)
										graph.update(y, 'result', result);
								}
								else{
									if(result == constraints[y])
										graph.update(y, 'result', result);
								}
							}
							else
								graph.update(y, 'result', result);
						}
						else{
							graph.update(y, 'result', result);
						}
					}
				});

				//Use result in list of nodes
				//Merge arguments from argsfrom and args
				var nodes = graph.get(x)['argsfrom'];
				if(nodes != undefined){
					var listofresults = nodes.map(function(v){
						if(v != undefined) 
							return graph.get(v).result
					});
					console.log("MY RESULTS: ", graph.get(x).func);
					var result = graph.get(x).func.apply(this, listofresults);
					graph.update(x, 'result', result);
				}	
			});
		}
	},

	//Only for "sync tasks"
	result: function(value){
			return gr.get(value).result;
	},

	//All tasks run async. Not pay attention to async flag
	runAsync: function(){
		var graph = gr
		var args = Array.prototype.slice.call(arguments)
		var simple = graph.getSingleNodes();
		if(!_.isEmpty(simple)){
			_.each(simple, function(x){
				var node = graph.get(x);
				q.fcall(node.func, 4).then(function(x){
					if(args.indexOf('logs') != -1)
						console.log("Task " + node.name + " is complete");
					graph.update(x, 'result', result)
				});
			})
		}

		var complex = graph.getComplexNodes();
		if(!_.isEmpty(complex)){
			_.each(complex, function(x){
				var tasks = graph.get(x).nodes;
				console.log("THIS IS TASKS: ", tasks)
			})
		}
	},

	runAsync2: function(){
		var graph = gr
		var complex = graph.getComplexNodes()
		if(!_.isEmpty(complex)){
			_.each(complex, function(parnode){
				var tasks = graph.get(parnode).nodes
				/*_.each(tasks, function(x){ 
					q.fcall(graph.get(x).func).then(function(res){
						console.log("THIS IS RES: ", res)
					})
				})*/

				q.allSettled(tasks.map(function(task){ return graph.get(task).func()}))
				 .then(function(res){
				 	//run parent task
				 })
			})
		}
	},

	/*Show how to looks task system
	  I.E. show connections between tasks
	*/
	showTaskMap: function(view){
		var graph = gr;
		var complex = graph.getComplexNodes();
		if(complex.length == 0){
			var single = graph.getSingleNodes();
			console.log("SINGLE NODES: ", single);
			return;
		}

		if(view == undefined || view == 1){
			showTaskMapOne(graph);
		}
		else if(view == 2){
			showTaskMapSecond(graph);
		}
	}

}
})();

//First Type of view
var showTaskMapOne = function(graph){
	var rootTasks = {};
	var childTasks = {};
	var complex = graph.getComplexNodes();
	console.log("ROOT NODES: ", complex.map(function(title, i){
		rootTasks[title] = i;
		return title + "(" + i + ")";
	}));

	for(var i in complex){
		graph.get(complex[i]).nodes.forEach(function(x){
			if(x in childTasks)
				childTasks[x].push(rootTasks[complex[i]]);
			else
				childTasks[x] = [rootTasks[complex[i]]]
		})
	}

	console.log("OTHER NODES: ", childTasks);
}

var showTaskMapSecond = function(graph){
	var complex = graph.getComplexNodes();
	var result = {};
	var singleTasks = [];
	var used = [];
	complex.forEach(function(x){
		result[x] = [];
		used.push(x);
	});

	for(var i in complex){
		graph.get(complex[i]).nodes.forEach(function(x){
				result[complex[i]].push(x);
				used.push(x);
		})
	};

	var single= graph.getSingleNodes();
	single.forEach(function(x){
		if(used.indexOf(x) == -1){
			singleTasks.push(x);
		}
	})

	console.log("TASKS: ", result);
	console.log("SINGLE TASKS: ", singleTasks);
}