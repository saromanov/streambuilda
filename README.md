Streambilda - easy system for build projects.
```javascript
	var builder = new BuilderAsync();
	builder.task('fun', Commands.imgrotate({path: './funimg.jpg', color:'red', degree:30}));
	builder.task('scripts', [Commands.jshint('./src/**')], Commands.concat(['./src/first.js', './src/second.js']), Commands.compress('./src/**')));
	builder.run();
```