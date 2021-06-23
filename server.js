'use strict';

const app = require('./app')(),
	port = 3000;

app.listen(port);
console.log('Server started at port:', port);

const Promise = require('promise');
const moment = require('moment');

const EventEmitter = require('events');
