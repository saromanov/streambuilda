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