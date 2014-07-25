

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
			var append = {'name': name, 'func': func, result:undefined, 'type':'single', 
			'args': undefined};
			graph[name] = append;
		},
		//Also, with arguments with tasks
		//name is parent
		setParents: function(array){
			graph[array['name']] = {'count': Object.keys(array).length, 'type': 'complex', 
			'nodes': array['tasks'], 'args': undefined, 'argsfrom':undefined, 'func': array['func']};
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

var TaskSystem = (function(){
	var gr = new TaskGraph();
	return {
		task: function(name,data){
			var args = Array.prototype.slice.call(arguments, 0)[0];
			if(Object.keys(args).length == 2)
				gr.set(args['name'], args['func']);
			else{
				gr.setParents(args)
			}
		},

		//Append arguments
		args: function(name){
			var arg = Array.prototype.slice.call(arguments, 1)[0];
			value = arg['value'];
			if(value != undefined)
				gr.update(name, 'args', value);
			var argsfrom = arg['argsfrom'];
			if(argsfrom != undefined)
				gr.update(name, 'argsfrom', argsfrom)
		},

		run: function(){
			var graph = gr;
			var complexNodes = graph.getComplexNodes();
			if(complexNodes.length == 0)
				throw new EmptyTaskException('This node has no tasks');
			complexNodes.forEach(function(x){
				var nodes = graph.get(x)['nodes'];
				nodes.forEach(function(y){
					var singlenode = graph.get(y);
					console.log(singlenode);
					if(singlenode.result == undefined){
						//console.log(singlenode.args);
						var result = singlenode.func(singlenode.args);
						graph.update(singlenode.name, 'result', result);
					}
				});

				//Use result in list of nodes
				var nodes = graph.get(x)['argsfrom'];
				var listofresults = nodes.map(function(x){ return graph.get(x)['result']});
				var result = graph.get(x)['func'].apply(this, listofresults);
				graph.update(x, 'result', result);
				
			})
		}
	}
})();
