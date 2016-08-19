var fs = require('fs');
const EventEmitter = require('events');
var config = require("./client.conf").config;

//var path = '/var/log/system.log';
//var pattern = 'Chrome';
var path = config.files.system[0];
var pattern = config.pattern[0];

var queue = [];
var pos;
var bufferString = '';

class FileEmitter extends EventEmitter {}
const fileEmitter = new FileEmitter();

fileEmitter.on('next', function() {
	var block = queue.shift();
	if( block.end > block.start ) {
		var readStream = fs.createReadStream(path, {start:block.start, end:block.end-1, encoding: 'UTF-8'});
		readStream.on('data', function(data) {
			bufferString += data;
			var lines = bufferString.split('\n');
			bufferString = lines.pop();
			for( var i=0; i<lines.length; i++ ) {
				line = lines[i];
				if( line.includes(pattern) ) {
					fileEmitter.emit('line', line);
					console.log(line + '\n');
				}
			}
		});
		readStream.on('end', function() {
			if( queue.length > 0 ) {
				fileEmitter.emit('next');
			}
		});
	}
});

fs.stat(path, function(err, stats) {
	pos = stats.size;
});

fs.watch(path, function(eventType, filename) {
	if( eventType === 'change' ) {
		fs.stat(path, function(err, stats) {
			if( err ) throw err;
			queue.push({start:pos, end: stats.size});
			pos = stats.size;
			fileEmitter.emit('next');
		});
	}
});

/*
fs.stat(path, function(err, stats) {
	if( err ) throw err;
	fs.access(path, fs.constants.R_OK, function(err) {
		if( err ) throw err;
		var prevSize = stats.size;
		var nextSize = stats.size;
		const buffer = new Buffer(bufferSize);
		var bufferString = '';
		console.log('access: ' + path);
		fs.watch(path, function(eventType, filename) {
			console.log('watch: ' + path);
			var readStream = fs.createReadStream(path, {start:prevSize, end:nextSize-1, encoding: 'UTF-8'});
			readStream.on('data', function(data) {
				bufferString += data;
				var lines = bufferString.split('\n');
				console.log(lines);
				prevSize = nextSize;
			});
		});
	});
});
*/

/*
var readStream = fs.createReadStream(path, {start:stats.size-50, encoding: 'UTF-8'});
readStream.on('readable', function() {
	var chunk;
	setInterval(function() {
		if( null !== (chunk = readStream.read()) ) {
			var lines = chunk.split('\n');
			for( var line in lines ) {
				console.log(lines[line]+'\n');
			}
		}
	}, 500);
});
} else {
console.log('Watch did not callback with a filename');
}
*/


/*
//console.log('stats:' + JSON.stringify(stats));
//console.log('size:' + stats.size);
fs.watch(path, function(eventType, filename) {
	if( filename ) {
		console.log('prevSize: ' + prevSize);
		fs.open(path, 'r', function(err, fd) {
			if( err ) throw err;
			fs.stat(path, function(err, stats) {
				nextSize = stats.size;
				console.log('nextSize: ' + nextSize);
			});
			fs.read(fd, buffer, 0, nextSize - prevSize, prevSize, function(err, bytesRead, buffer2) {
				var string = buffer2.toString('utf8', 0, nextSize - prevSize);
				console.log(string);
				prevSize = nextSize;
			});
			fs.close(fd, function() {

			});
		});
	}
});
*/