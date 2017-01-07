'use strict';

var caller = require('caller');
var path = require('path');
var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var verbose = argv.v || argv.verbose || false;

function version (source) {
	var v;

	var p = path.resolve(source, 'package.json');
	try {
		fs.statSync(p);
	} catch (e) {
		if (verbose) {
			console.error(e);
		}
	}
	try {
		v = require(p).version;
	} catch (e) {
		if (verbose) {
			console.error(e);
		}
	}
	return v;
}

module.exports = function () {
	return version(path.dirname(caller()));
};

module.exports.version = version;
