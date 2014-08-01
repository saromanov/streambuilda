function test_read_builder(){
	var q = new Builder();
	q.read('.');
	q.mkdir("A");
	q.modules(['fs', 'fast.js'])
	q.log("FUN");
	q.write('output.js')
	q.run();
}

function test_task_system_inv(){
	var t = TaskSystem;
	t.task({'name': 'construct', 'func':function(a){
		return a;
	}, 'tasks': ['prepare', 'complete']});
	t.task({'name': 'complete', 'func': function(a){
		return a + 5;
	}});
	t.task({'name': 'prepare', 'func': function(b){
		return b + 7;
	}});
	t.task({'name': 'multi', 'func': function(){
		var a = arguments[0];
		var b = arguments[1];
		return a * b;
	}});
	t.task({'name': 'dic', 'func': function(x){
		return x + 5;
	}, tasks: ['prepare', 'construct']});

	t.args('construct', {'argsfrom':['prepare', 'complete']});
	t.args('complete', {'value':10});
	t.args('prepare', {'value':10});
	t.args('multi', {'value':25});
	t.args('dic', {'argsfrom':['prepare', 'construct']});
	t.run();
}

function test_arguments_append(){
	var t = TaskSystem;
	t.task({'name' :'prepare', 'func': function(b){
		return b + 7;
	}});
	t.task({'name': 'value', 'func': function(a){
		return a * 5;
	},'tasks': ['prepare']});
	t.args('prepare', {'value':5})
	t.args('value', {'argsfrom': ['prepare']});
	t.run();
}

function test_callback(a, data){
	console.log(data);
}
function test_simple_task(){
	var t = TaskSystem;
	t.task({'name':'read', 'func': fs.readFile});
	t.args('read', {'value':['tasks.js', 'utf-8', test_callback]});
	t.run();
	//In Sync version
	console.log(t.result('read'));
}