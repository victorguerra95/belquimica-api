module.exports = function(app) {
	'use strict';

	const utils = require('../utils/utils')(app);
	const filesConfig = require('../utils/filesConfig')(app);
	const ValidateParams = require('./routes_validations');
	const ControllerVideo = require('../controllers/videos');

	let validateParams;
	let controllerVideo;

	function setUp() {
		validateParams = new ValidateParams(app);
		controllerVideo = new ControllerVideo(app);

		routesDefinitions();
		app.use(function(err, req, res, next) {
			return utils.handleError(err, req, res, next);
		});
	}

	function routesDefinitions() {

		app.route('/api/createVideo')
		.post(controllerVideo.createVideo);

		app.route('/api/media/sign')
		.get(controllerVideo.mediaSign);

		app.route('/api/media/:token')
		.put(controllerVideo.mediaUpdate)
		.get(controllerVideo.getMedia);

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
