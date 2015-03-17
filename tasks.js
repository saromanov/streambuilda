var async = require('async')
	fs = require('fs')
	comm = require('commands')
	Q = require('q')
	uuid = require('node-uuid')
	sleep = require('sleep')
	

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

var EmptyTaskException = function(message) {
   this.message = message;
   this.name = "EmptyListException";
}

var SomethingException = function(message){
	this.message = message
	this.name = "SomethingWentWrongException";
}

var TaskGraph = function(){
	var graph = {};
	return {

		//Set single tasks
		set: function(data){
			if(data.name != undefined){
				var argum = data.args;
				if(!Array.isArray(argum))
					argum = [argum];
				var append = {name: data.name, func: data.func, result:undefined, type:'single', 
								args: argum, async:data.async};
				graph[data.name] = append;
			}
		},
		//Append list of tasks
		setList: function(data){
			var subtasks = [];
			_.each(data.tasks, function(x){
				var append = {'subtask': uuid.v4(), func:x, 'type': 'single'};
				subtasks.push(append);
			});
			graph[data.name] = {type: 'subtasks', tasks: subtasks, name:data.name, connect: data.connect, async:data.async};
		},

		//Remove node from graph(if graph exist)
		remove: function(taskname){
			if(taskname in graph){
				delete graph[taskname];
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

		getTasksWithSubTasks: function(){
			return filter1(graph, 'type', 'subtasks');
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
	var tests = {}
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

		/*
			Test result, after the completion of the task
		*/
		test: function(name, func){
			tests.name = func;
		},


		taskIfElse: function(taskif, taskelse){
			Q.fcall(taskif.run).then(function(result){
				if(result != true)
					taskelse.run();
			});
		},

		tasks: function(params){
			if(params == undefined){
				console.error("Task function not contain information about tasks");
				return;
			}
			gr.setList(params);
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
				gr.update(name.name, 'args', [name.args]);
			var argsfrom = name.argsfrom;
			if(argsfrom != undefined)
				gr.update(name, 'argsfrom', argsfrom)
		},
		
		run: function(startnode, globalvariables){

			//Not for async events
			var graph = gr;
			if(graph == undefined)
				throw ("This graph object is undefined")
			var complexNodes = graph.getComplexNodes();
			var singleNodes = graph.getSingleNodes();
			var subTasksNodes = graph.getTasksWithSubTasks();
			if(!_.isEmpty(complexNodes)){
				runComplexTasks(graph, complexNodes);
			}
			if(!_.isEmpty(singleNodes))
				runSingleTasks(graph, singleNodes);
			if(!_.isEmpty(subTasksNodes))
				runTasksWithSubTasks(graph, subTasksNodes);

			/* Optional testing of tasks */
			_.each(tests, function(func, tasktitle){
				if(func()){
					var msg = "Task: " + tasktitle + " is complete"
					console.log(msg.green)
				}
				else{
					var msg = "Task: " + tasktitle + " is not completely correct"
					console.log(msg.red)
				}
			})

	},

	runSeq: function(tasknames, initval){
		/* Run tasks as sequences */
		var graphdata = gr.data();
		if(!Array.isArray(tasknames))
		{
			console.error("data is not array of tasknames");
			return;
		}
		if(tasknames.length == 0){
			console.error("Data is not contain elements");
			return;
		}
		var result = Q(initval)
		tasknames.forEach(function(f){
			if(f in graphdata){
				var isfunc = graphdata[f].func;
				if(isfunc)
					result = result.then(isfunc);
			}
		})

	},

	//Only for "sync tasks"
	result: function(value){
			return gr.get(value).result;
	},

	//All tasks run async. Not pay attention to async flag
	//Some commands already run as async
	runAsync: function(){
		var graph = gr;
		var args = Array.prototype.slice.call(arguments);
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
				_.each(tasks, function(subtask){
					q.fcall(node.func, 4).then(function(y){})
				})
			})
		}
	},

	//Only with complex task case and as sequence
	runAsync2: function(){
		var graph = gr
		var complex = graph.getComplexNodes()
		if(!_.isEmpty(complex)){
			_.each(complex, function(parnode){
				var tasks = graph.get(parnode).nodes
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
	},

	info:function(){
		return {complex: gr.getComplexNodes(), simple: gr.getSingleNodes(), subtasks: gr.getTasksWithSubTasks()}
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


//Run for 3-case of run in task method
var runTask = function(graph, task){
	var current_task = graph.get(task);
	/* Run over all subtasks */
	var result = Q(current_task.tasks);
	var msg = "Info: Task " + task + " contains " + current_task.tasks.length + " tasks";
	console.log(msg)
	_.each(current_task.tasks, function(subtask){
		if(current_task.async == true){
			Q.fcall(subtask.func.run)
			 .then(function(x){
			 	
			 })
			 .fail(function(erroe){
			 	console.log("Task was failed")
			 })
			 .done()
			//result = result.then(subtask.func.run);
		}
		else{
			subtask.func.run();
		}
		sleep.sleep(1);
	});
}


//TODO
var Constraints = function(graph, result, y, constraints){
	//Append constraints for tasks
	if(_.isUndefined(constraints) == false){
		var keys = Object.keys(constraints)
		if(keys.indexOf(y) != -1){
			if(_.isObject(constraints[y])){
					var data = constraints[y];
					if(result >= data.min && result <= data.max)
						graph.update(y, 'result', result);
						return;
					}
				else{
					if(result == constraints[y])
						graph.update(y, 'result', result);
					return;
					}
		}
	}
	graph.update(y, 'result', result);
}


//Parallel tasks without parents
var runSingleTasks = function(graph, singleNodes){
	if(!_.isEmpty(singleNodes)){
		//Case without a complex nodes
		_.each(singleNodes, function(x){
			sgraph = graph.get(x);
			//If async flag is on, run in async
			if(sgraph.async){
				Q.fcall(sgraph.func, sgraph.args).then(function(result){
					graph.update(x, 'result', result);
					FinishedMessage('Finished task ' + x);
				}).done();
			}
			else{
				if(sgraph.args == undefined){
					message = "Something Went Wrong and arguments in task '" + sgraph.name + "' is undefined"
					throw new SomethingException(message);
				}
				var result = sgraph.func.apply(this, sgraph.args);
				//Update if this return value
				graph.update(x, 'result', result);
				FinishedMessage('Finished task ' + x);
			}
			sleep.sleep(1);
		});
				//throw new EmptyTaskException('This node has no tasks');
	}
	return graph;
}


var runComplexTasks = function(graph, complexNodes){
	complexNodes.forEach(function(x){
		var nodes = graph.get(x)['nodes'];
		nodes.forEach(function(y){
		//Get list of connected simple nodes
		var singlenode = graph.get(y);
		if(singlenode != undefined){
			//var result = singlenode.func.apply(this, singlenode.args);
			singlenode.func();
			//console.log(nodes)
			//TODO: Weak place(Need async solution)

			//Now constraints only for numbers
			var constraints = graph.get(x).constraints;
			}
		});

		//Use result in list of nodes
		//Merge arguments from argsfrom and args
		var nodes = graph.get(x)['argsfrom'];
		if(nodes != undefined){
			var result = graph.get(x).func()
			graph.update(x, 'result', result);
			}
		});
}


var runTasksWithSubTasks = function(graph, subTasksNodes, startnode){
	//Run async tasks if exist
	//Run in the case with subtasks
	if(startnode != undefined){
		//var start_task = graph.get(startnode);
		runTask(graph, startnode);
		graph.remove(startnode);
		subTasksNodes = graph.getTasksWithSubTasks();
	}
	//Запускать асинхронные события, когда есть подзадачи
	var complex = subTasksNodes.filter(function(task){
			return graph.get(task).connect != undefined;
	});
	//Q.all(_.each(subTasksNodes, function(x){ return graph.get(x);}));
	_.each(subTasksNodes, function(task){
			runTask(graph, task);
	});
}



var FinishedMessage = function(message){
	console.log(message.yellow);
};
