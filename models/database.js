module.exports = function Database(app) {
	'use strict';

	const Sequelize = require('sequelize');
	const async = require('async');
	const Promise = require('promise');
	const config = require('../config');
	const moment = require('moment');
	var request = require('request');

	const schedule = require('node-schedule');

	function setUp(db) {
		let sequelize = new Sequelize(config.name, config.user, config.password, config.options);
		app.set('sequelize', sequelize);

		sequelize.authenticate().then(function (data) {
			//return addPostgistExtension(sequelize);
		}).then(() => {
			defineTables(sequelize);
		}).catch((err) => {
			if(err.message !== 'extension "postgis" already exists') {
				console.log(err);
			}
		});
	}

	function defineTables(sequelize) {
		let tableDefaultMetadata = {
			timestamps: true,
			createdAt: 'created_at',
			updatedAt: 'updated_at',
			deletedAt: 'deleted_at',
			paranoid: true,
			underscored: true,
			freezeTableName: true
		};

		const User = sequelize.define('users', {
			email: Sequelize.STRING,
			firebase_uid: Sequelize.TEXT
		}, tableDefaultMetadata);

		const UserType = sequelize.define('user_types', {
			label: Sequelize.STRING
		}, tableDefaultMetadata);

		const Client = sequelize.define('clients', {
			name: Sequelize.STRING,
			name_term: Sequelize.STRING,
			doc: Sequelize.STRING,
			state: Sequelize.STRING,
			city: Sequelize.STRING,
			address: Sequelize.TEXT
		}, tableDefaultMetadata);

		const ClientUser = sequelize.define('client_users', {
		}, tableDefaultMetadata);

		const Contact = sequelize.define('contacts', {
			name: Sequelize.STRING,
			email: Sequelize.STRING,
			sector: Sequelize.STRING
		}, tableDefaultMetadata);

		const Point = sequelize.define('points', {
			name: Sequelize.TEXT
		}, tableDefaultMetadata);

		const Collect = sequelize.define('collects', {
			collect_date: Sequelize.DATE,
			analysis_date: Sequelize.DATE,
			collect_data: Sequelize.JSON,
			report_shared: {
				type: Sequelize.BOOLEAN,
				defaultValue: false
			},
		}, tableDefaultMetadata);

		User.belongsTo(UserType);
		UserType.hasMany(User);

		ClientUser.belongsTo(User);
		ClientUser.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(ClientUser);

		Contact.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(Contact);

		Point.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(Point);

		Collect.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(Collect);

		// Syncronize
		sequelize.sync().then(function() {
			seed(UserType, User);
		});

		function seed(UserType, User){
			UserType.count().then(c => {
				if(c == 0){
					var types = require('../config/seed_user_type.json');
					UserType.bulkCreate(types, {
						fields: ['label']
					}).then(data => {
						console.log("seed_user_type created: " + data.length);

						User.count({
							where: {
								email: "belquimicadev@gmail.com"
							}
						}).then(c => {
							if(c == 0){
				
								var new_user = {
									email: "belquimicadev@gmail.com",
									firebase_uid: "KrABDB3dzuRt9OgxxYAz7bC1X3f2"
								};
				
								User.create({
									email: new_user.email,
									firebase_uid: new_user.firebase_uid,
									user_type_id: 1
								}).then(data => {
									console.log("User dev created: " + data);
								});
							}
						});

					});
				}
			});
		}

		app.set('models', {
			User,
			UserType,
			Client,
			ClientUser,
			Contact,
			Point,
			Collect
		});
	}
	
	return {
		setUp
	};
};
