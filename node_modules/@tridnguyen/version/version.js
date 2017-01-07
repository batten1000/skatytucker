#!/usr/bin/env node

'use strict';

var version = require('./');

console.log(version.version(process.cwd()));
