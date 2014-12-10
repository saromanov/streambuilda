
var example1 = function(){
	var build = new BuilderAsync();
	build.task('name1', [Commands.jshint('./testfile.js')]);
	build.run();
}

function testzen(val){
	return val + 1;
}

function test2(val){
	return val * 2;
}

function test_seq(){
	var build = new BuilderAsync();

	build.seq([testzen, test2],5);
}

function livescript_example(){
	var build = new BuilderAsync();
	build.task('ls', Commands.livescript('./fun5.ls'));
	build.run();
}

function example_list_of_tasks(){
	var build = new BuilderAsync();
	build.task('name1', [Commands.jshint('./streambuilda.js'),
						 	  Commands.log('Streams was prepared'),
						 	  Commands.livescript('./fun5.ls')]);
	build.runExpr();
}