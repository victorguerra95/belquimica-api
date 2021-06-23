module.exports = function App() {
	'use strict';

	var cors = require('cors');

	const express = require('express'),
		bodyParser = require('body-parser'),
		expressValidator = require('express-validator'),
		FilesConfig = require('./utils/filesConfig'),
		Database = require('./models/database'),
		Routes = require('./routes');

	let	app,
		routes,
		database,
		filesConfig;

	app = express();
	app.use(cors());
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json({
		limit: "2mb"
	}));
	app.use(expressValidator());
	
	app.set('trust proxy', true);
	app.enable('trust proxy');
	//app.set('trust proxy', 'loopback');
	app.use(function(req, res, next) {
		app.ipInfo = req.headers['x-forwarded-for'] ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		req.connection.socket.remoteAddress;
		next();
	});
	//app.ipInfo = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	database = new Database(app);
	database.setUp();

	routes = new Routes(app);
	routes.setUp();

	filesConfig = new FilesConfig(app);
	filesConfig.createFolders();

	return app;
}