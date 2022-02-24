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

		/*
		if(req.url.match("/private/")){

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
		}*/

		const User = app.get('models').User;
		const ClientUser = app.get('models').ClientUser;
		const Client = app.get('models').Client;

		try {
			var token = req.headers['authorization'];
			if (!token) return res.status(401).json({ status: 'error', auth: false, error: 'no_token_provided' });

			admin
			.auth()
			.verifyIdToken(token)
			.then((decodedToken) => {

				let where_user = {
					firebase_uid: decodedToken.uid
				};
				if(req.url.match("/admin/")){
					where_user.user_type_id = 1;
				}else if(req.url.match("/client/")){
					where_user.user_type_id = 2;
				}

				User.findOne({
					where: where_user
				}).then(userData => {	

					if(userData != null){

						if(userData.user_type_id == 2){

							ClientUser.findOne({
								where: {
									user_id: userData.id
								},
								include: [
									{
										model: Client
									}
								]
							}).then(client_user => {	
			
								if(userData != null){
									req.client_user = client_user;
									req.firebase_uid = decodedToken.uid;
									req.user = userData;
									next();
								}else{
									throw "failed_authenticate_token";
								}
								
							}).catch(function (err) {
								console.log("error: " + err);
								return res.status(401).json({ status: 'error', auth: false, error: 'failed_authenticate_token' });
							}); 

						}else{

							req.firebase_uid = decodedToken.uid;
							req.user = userData;
							next();
						}

						
					}else{
						throw "failed_authenticate_token";
					}
					
				}).catch(function (err) {
					console.log("error: " + err);
					return res.status(401).json({ status: 'error', auth: false, error: 'failed_authenticate_token' });
				});   
				
			})
			.catch((error) => {
				console.log("error: " + error);
				return res.status(401).json({ status: 'error', auth: false, error: 'failed_authenticate_token' });
			});
		} catch (error) {
			return res.status(401).json({ status: 'error', auth: false, error: 'failed_authenticate_token' });
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