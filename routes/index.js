module.exports = function(app) {
	'use strict';

	const utils = require('../utils/utils')(app);
	const filesConfig = require('../utils/filesConfig')(app);
	const ValidateParams = require('./routes_validations');
	let validateParams;
	
	//USER
	const ControllerUser = require('../controllers/user');

	let controllerUser;

	//ADMIN
	const ControllerClient = require('../controllers/client');
	const ControllerCollect = require('../controllers/collect');
	
	let controllerClient;
	let controllerCollect;

	//CLIENT
	const ClientControllerCollect = require('../controllers/client/collect');
	const ClientControllerFile = require('../controllers/client/file');

	let clientControllerCollect;
	let clientControllerFile;

	function setUp() {
		validateParams = new ValidateParams(app);

		//USER
		controllerUser = new ControllerUser(app);
		
		//ADMIN
		controllerClient = new ControllerClient(app);
		controllerCollect = new ControllerCollect(app);

		//CLIENT
		clientControllerCollect = new ClientControllerCollect(app);
		//clientControllerFile = new ClientControllerFile(app);

		routesDefinitions();
		app.use(function(err, req, res, next) {
			return utils.handleError(err, req, res, next);
		});
	}

	function routesDefinitions() {

		//USER PRIVATE
		app.route('/api/private/user/status')
		.get(controllerUser.getUserStatus);

		//ADMIN
		
		app.route('/api/private/admin/file/sign')
		.get(controllerClient.signFile);

		app.route('/api/private/admin/clients/files')
		.post(controllerClient.createFile)
		.get(controllerClient.getFiles)
		.delete(controllerClient.deleteFile);

		app.route('/api/private/admin/clients')
		.post(controllerClient.createClient)
		.get(controllerClient.getClients)
		.put(controllerClient.updateClient)
		.delete(controllerClient.deleteClient);

		app.route('/api/private/admin/collects')
		.post(controllerCollect.createCollect)
		.put(controllerCollect.updateCollect)
		.get(controllerCollect.getCollects)
		.delete(controllerCollect.deleteCollect);

		app.route('/api/private/admin/collects/getCollectReport')
		.get(controllerCollect.getCollectReport);

		app.route('/api/private/admin/collects/updateParameters')
		.post(controllerCollect.updateParameters);

		app.route('/api/private/admin/collects/updateSystems')
		.post(controllerCollect.updateSystems);

		app.route('/api/private/admin/collects/updateCollectSystem')
		.post(controllerCollect.updateCollectSystem);

		app.route('/api/private/admin/collects/updateCollectSystem/order')
		.post(controllerCollect.updateCollectSystemOrder);

		app.route('/api/private/admin/collects/duplicateCollectSystem')
		.post(controllerCollect.duplicateCollectSystem);

		app.route('/api/private/admin/points')
		.get(controllerCollect.getPoints);

		//CLIENT
		app.route('/api/private/client/collects')
		.get(clientControllerCollect.getCollects);

		app.route('/api/private/client/collects/getCollectReport')
		.get(clientControllerCollect.getCollectReport);

		//app.route('/api/private/client/files')
		//.get(clientControllerFile.getFiles);
	}

	return {
		setUp
	};
};
