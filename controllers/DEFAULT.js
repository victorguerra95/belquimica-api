module.exports = function(app) {
	'use strict';

	const DefaultDataModel = require('../models/DEFAULT'),
		utils = require('../utils/utils');

	function createAction(req, res, next) {
		let defaultData = {

		};

		const defaultDataModel = new DefaultDataModel(app);
		defaultDataModel.create(defaultData).then((data) => {
			return res.status(200).json(utils.responseSuccess(data));
		}).catch(next);
	}

	function findSingleAction(req, res, next) {

	}

	function findAction(req, res, next) {

	}

	function updateAction(req, res, next) {

	}

	return {
		createAction,
		findSingleAction,
		findAction,
		updateAction
	};
};
