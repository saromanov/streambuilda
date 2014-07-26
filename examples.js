function test_read_builder(){
	var q = new Builder();
	q.read('.');
	q.mkdir("A");
	q.modules(['fs', 'fast.js'])
	q.log("FUN");
	q.write('output.js')
	q.run();
}