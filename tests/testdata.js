//http://unitjs.com/guide/should-js.html
var should = require('should')
var BuilderAsync = require('../streambuilda.js')
var styl = require('styl')

var Commands = requirejs('./commands')
requirejs.config({
baseUrl: __dirname,
nodeRequire: require
});

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

/*
	Run as sequence
*/
var testSeq2 = function(){
	var builder = new BuilderAsync();
	builder.task('seq1', Commands.livescript('astro.ls'));
	builder.taskAsync('simple', Commands.jshint('streambuilda.js'));
	builder.seq(['seq1', 'simple'])
}

var testProject1 = function(){
	//Pr1 папка с тестовым проектом
	//ДОлжны создаться
	//var builder = new BuilderAsync({output:'log.txt'});
	var builder = new BuilderAsync()
	builder.taskAsync('lstojs', Commands.livescript('./pr1/astro.ls'));
	builder.taskAsync('img', Commands.imgrotate({path: './pr1/funimg2.jpg', color:'red', degree:30}))
	//builder.task('jshint', Commands.jshint('./pr1/tasks.js'))
	builder.taskAsync('construct', [Commands.shell('mkdir', ['./pr1']), Commands.shell('mkdir', ['./pr1/img']), Commands.shell('mkdir', ['./pr2'])])
	builder.taskAsync('cp', Commands.move('./pr1/astro.ls', './pr1/src/astro.ls'))
	builder.taskAsync('lr', Commands.livereload('./'))
	builder.run();
	console.log("Task Status: ", builder.taskStatus('img'))

	//TODO: Изменить цвета выполненных тасков и провальных
	//TODO: Система ошибок для тасков

}


var testProject2 = function(){
	var builder = new BuilderAsync()
	builder.taskAsync('styles', [Commands.styl("A", 'body\n  color: blue')]);
	//builder.taskAsync('scripts', []);
	builder.taskAsync('server', Commands.livereload('.'));
	builder.taskAsync('watcher', Commands.watchChanges('.'));
	builder.run()
}

var testConfigure = function(){
	var builder = new BuilderAsync();
	builder.configureRun('taskdata.json');
}


var testAnother = function(){
	var builder = new BuilderAsync();
	builder.task(9855, function(){ console.log("Hello"); })
	builder.seq();
	builder.run();
}


var testListOfAsyncTasks = function(){
	var builder = new BuilderAsync();
	builder.task('lstojs', [Commands.livescript('../astro.ls')]);
	builder.run();
}
