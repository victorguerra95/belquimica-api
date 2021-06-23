module.exports = function() {
	'use strict';

	const config = require('../config');

	function handleError(err, req, res, next) {
		let response = {};
		if(process.env.ENV !== 'production') {
			response = responseError(err);
		}

		console.log(err);
		console.trace();
		return res.status(500).json(response);
	}

	function responseSuccess(data) {
		return {
			status: 'success',
			data: data
		};
	}

	function responseError(err) {
		return {
			status: 'error',
			error: err.message || err
		};
	}

	function parseFile(file) {
		if(!file) {
			return null;
		}

		return {
			name: file.filename,
			path: '/uploads/' + file.filename,
			size: file.size,
			type: file.mimetype
		};
	}

	function formatFile(file) {
		if(!file) {
			return null;
		}

		return {
			name: file.name,
			url: config.baseUrl + file.path,
			size: file.size
		}
	}

	return {
		handleError,
		responseSuccess,
		responseError,
		parseFile,
		formatFile
	};

};
