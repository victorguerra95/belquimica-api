module.exports = function(app) {
	'use strict';

	const utils = require('../utils/utils')(app);
	const filesConfig = require('../utils/filesConfig')(app);
	const ValidateParams = require('./routes_validations');
	const ControllerClient = require('../controllers/client');
	const ControllerCollect = require('../controllers/collect');

	let validateParams;
	let controllerClient;
	let controllerCollect;

	function setUp() {
		validateParams = new ValidateParams(app);
		controllerClient = new ControllerClient(app);
		controllerCollect = new ControllerCollect(app);

		routesDefinitions();
		app.use(function(err, req, res, next) {
			return utils.handleError(err, req, res, next);
		});
	}

	function routesDefinitions() {

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

		app.route('/api/private/admin/collects/updateParameters')
		.post(controllerCollect.updateParameters);

		app.route('/api/private/admin/collects/updateSystems')
		.post(controllerCollect.updateSystems);

		app.route('/api/private/admin/collects/updateCollectSystem')
		.post(controllerCollect.updateCollectSystem);

		app.route('/api/private/admin/points')
		.get(controllerCollect.getPoints);

		/*
		app.route('/api/changeTextChallenge/:text')
		.post(controllerExample.getStories);
		.get(instaStoriesController.changeTextChallenge);
		*/

	}

	return {
		setUp
	};
};
