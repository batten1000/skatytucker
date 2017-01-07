'use strict';

var tap = require('tap');
var version = require('./');

tap.equal(version(), '1.0.0');
tap.equal(version.version('.'), '1.0.0');
