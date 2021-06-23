module.exports = function(app) {
	const Promise = require('promise');

	const Default = app.get('models').Default;

	function create(data) {
		return new Promise((resolve, reject) => {

		});
	}

	function find(filter) {
		return new Promise((resolve, reject) => {

		});
	}

	function list(filter) {
		return new Promise((resolve, reject) => {

		});
	}

	function update(filter, changes) {
		return new Promise((resolve, reject) => {

		});
	}

	return {
		create,
		find,
		list,
		update
	};
};
