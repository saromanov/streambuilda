
var TaskGraph = function(){
	var graph = {};
	return {
		set: function(name, func){
			var append = {'name': name, 'func': func};
			graph[name] = func;
			console.log(graph);
		},
		//Also, with arguments with tasks
		//name is parent
		setParents: function(array){
			var arglen = array.length;
			var nodes = this._getNodes(array.slice(2, arglen));
			graph[array[0]] = nodes;
		},

		_getNodes: function(nodes){
			var obj = {};
			nodes.forEach(function(x){
				obj[x] = graph[x];
			});
			return obj;
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
	task: function(name, data){
		if(arguments.length == 2)
			this.gr.set(name, data);
		else{
			var array = Array.prototype.slice.call(arguments, 0);
			this.gr.setParents(array)
		}
	},
	run: function(){
		
	}
}
