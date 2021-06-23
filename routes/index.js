module.exports = function(app) {
	'use strict';

	const utils = require('../utils/utils')(app);
	const filesConfig = require('../utils/filesConfig')(app);
	const ValidateParams = require('./routes_validations');
	const ControllerClient = require('../controllers/client');

	let validateParams;
	let controllerClient;

	function setUp() {
		validateParams = new ValidateParams(app);
		controllerClient = new ControllerClient(app);

		routesDefinitions();
		app.use(function(err, req, res, next) {
			return utils.handleError(err, req, res, next);
		});
	}

	function routesDefinitions() {

		app.route('/api/private/admin/clients')
		.get(controllerClient.getClients);

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
