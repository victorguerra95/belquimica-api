module.exports = function App() {
	'use strict';

	var cors = require('cors');

	const admin = require('firebase-admin');
	var serviceAccount = require("./belquimica-pro-firebase-adminsdk-tfgqr-d6da9f87a1.json");
    admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
        //credential: admin.credential.applicationDefault(),
    });

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

		if(req.url.match("/private")){

			var token = req.headers['authorization'];
			if (!token) return res.status(401).json({ status: 'error', auth: false, error: 'no_token_provided' });

			admin
			.auth()
			.verifyIdToken(token)
			.then((decodedToken) => {
				//console.log("decodedToken: " + JSON.stringify(decodedToken));
				req.firebase_uid = decodedToken.uid;
				next();
			})
			.catch((error) => {
				console.log("error: " + error);
				return res.status(401).json({ status: 'error', auth: false, error: 'failed_authenticate_token' });
			});

		}else{
			next();
		}

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