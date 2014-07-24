

//Data is dict object
var filter1 = function(data, key, value){
	return Object.keys(data).filter(function(x){
		return data[x][key] == value});
}

function EmptyTaskException(message) {
   this.message = message;
   this.name = "EmptyListException";
}

var TaskGraph = function(){
	var graph = {};
	return {
		set: function(name, func){
			var append = {'name': name, 'func': func, result:undefined, 'type':'single'};
			graph[name] = append;
		},
		//Also, with arguments with tasks
		//name is parent
		setParents: function(array){
			var arglen = array.length;
			var nodes = array.slice(2, arglen);
			graph[array[0]] = {'count': Object.keys(nodes).length, 'type': 'complex', 
			'nodes': nodes};
		},

		_getNodes: function(nodes){
			var obj = [];
			nodes.forEach(function(x){
				obj[x] = graph[x];
			});
			return obj;
		},
		get: function(node){
			if(node in graph)
				return graph[node];
		},
		data: function(){ return graph;},

		getComplexNodes: function(){
			return filter1(graph, 'type', 'complex');
		},

		//Update node. For Ex: Set in result value
		update: function(node, type, value){
			if(node in graph){
				var cnode = graph[node]
				cnode[type] = value;
				graph[node] = cnode;
			}
		}
	}
}


/*Task system looks like a factor graph, but without probability
	
*/

function TaskSystem(){
	this.gr = new TaskGraph();
}

//Need
TaskSystem.prototype = {
	task: function(name
		, data){
		if(arguments.length == 2)
			this.gr.set(name, data);
		else{
			var array = Array.prototype.slice.call(arguments, 0);
			this.gr.setParents(array)
		}
	},
	run: function(){
		var graph = this.gr;
		var complexNodes = graph.getComplexNodes();
		if(complexNodes.length == 0)
			throw new EmptyTaskException('This node has no tasks');
		complexNodes.forEach(function(x){
			var nodes = graph.get(x)['nodes'];
			nodes.forEach(function(y){
				var singlenode = graph.get(y);
				if(singlenode.result == undefined){
					var result = singlenode.func(singlenode.arguments);
					graph.update(singlenode.name, 'result', result);
				}
			});

			//Use result in list of nodes
			console.log(graph.get(x));
		});
	}
}


