//http://unitjs.com/guide/should-js.html
var should = require('should')
var BuilderAsync = require('../streambuilda.js')

var Test1 = function(){
	var builder = new BuilderAsync();
	builder.task('name1', [Commands.log("This is some log"),
						 Commands.jshint('./streambuilda.js')]);
	builder.run();
}

var TestComplexNodes = function(){
	var builder = new BuilderAsync();
	builder.task('name2',  Commands.log('FUn'))
	builder.task('name3', Commands.log("Checker"), ['name2'])
	builder.run();
}

/*
	Example with load configuration from json file
*/
var LoadFromConfigure = function(){
	var builder = new BuilderAsync();
	builder.configureRun('taskdata.json');
}

/*
	Example for loading function from serialization data 
*/
var testRegisterFunction = function(){
	var builder = new BuilderAsync();
	builder.usertask('hello');
	builder.run();
}

/* Example of sequential execution of tasks */

var testSeq = function(){
	var builder = new BuilderAsync();
	builder.task('seq1', [Commands.livescript('test.ls'), 
						Commands.shell('cp', ['test.js', 'test2.js'])])
	builder.run();
}

/* Example of tasting task after completion */

var testCompletion = function(){
	var builder = new BuilderAsync();
	builder.task('seq1', [Commands.livescript('astro.ls'), 
						Commands.shell('cp', ['astro.js', 'astro3.js'])]);
	builder.taskTest('seq1', function(){
		return fs.existsSync('./astro3.js')
	});
	builder.run()
}
