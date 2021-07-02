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

		const System = sequelize.define('systems', {
			name: Sequelize.STRING,
			name_term: Sequelize.STRING
		}, tableDefaultMetadata);

		const ClientSystem = sequelize.define('client_systems', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			client_id: {
				type: Sequelize.INTEGER,
				references: {
					model: Client,
					key: 'id'
				}
			},
			system_id: {
				type: Sequelize.INTEGER,
				references: {
					model: System,
					key: 'id'
				}
			}
		});

		const ClientUser = sequelize.define('client_users', {
		}, tableDefaultMetadata);

		const Contact = sequelize.define('contacts', {
			name: Sequelize.STRING,
			email: Sequelize.STRING,
			sector: Sequelize.STRING
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

		const CollectSystem = sequelize.define('collect_systems', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			collect_id: {
				type: Sequelize.INTEGER,
				references: {
					model: Collect,
					key: 'id'
				}
			},
			system_id: {
				type: Sequelize.INTEGER,
				references: {
					model: System,
					key: 'id'
				}
			},
			input_comments: Sequelize.JSON
		});

		const Parameter = sequelize.define('parameters', {
			name: Sequelize.STRING,
			name_term: Sequelize.STRING
		}, tableDefaultMetadata);

		const CollectSystemParameter = sequelize.define('collect_system_parameters', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			collect_system_id: {
				type: Sequelize.INTEGER,
				references: {
					model: CollectSystem,
					key: 'id'
				}
			},
			parameter_id: {
				type: Sequelize.INTEGER,
				references: {
					model: Parameter,
					key: 'id'
				}
			},
			unit: Sequelize.STRING,
			value: Sequelize.STRING,
			value_graphic: Sequelize.TEXT,
			default_value_min: Sequelize.STRING,
			default_value_max: Sequelize.STRING,
			factor_value_graphic: Sequelize.STRING
		});

		// Collect, System

		Collect.belongsToMany(System, {
			through: CollectSystem,
			as: 'systems',
			foreignKey: 'collect_id',
			otherKey: 'system_id'
		});

		System.belongsToMany(Collect, {
			through: CollectSystem,
			as: 'collects',
			foreignKey: 'system_id',
			otherKey: 'collect_id'
		});

		Collect.hasMany(CollectSystem, {foreignKey: 'collect_id'});
		CollectSystem.belongsTo(Collect, {foreignKey: 'collect_id', onDelete: 'CASCADE'});

		System.hasMany(CollectSystem, {foreignKey: 'system_id' });
		CollectSystem.belongsTo(System, {foreignKey: 'system_id'});

		// CollectSystem, Parameter

		CollectSystem.belongsToMany(Parameter, {
			through: CollectSystemParameter,
			as: 'parameters',
			foreignKey: 'collect_system_id',
			otherKey: 'parameter_id'
		});

		Parameter.belongsToMany(CollectSystem, {
			through: CollectSystemParameter,
			as: 'collect_systems',
			foreignKey: 'parameter_id',
			otherKey: 'collect_system_id'
		});

		CollectSystem.hasMany(CollectSystemParameter, {foreignKey: 'collect_system_id'});
		CollectSystemParameter.belongsTo(CollectSystem, {foreignKey: 'collect_system_id', onDelete: 'CASCADE'});

		Parameter.hasMany(CollectSystemParameter, {foreignKey: 'parameter_id' });
		CollectSystemParameter.belongsTo(Parameter, {foreignKey: 'parameter_id'});

		// User, UserType

		User.belongsTo(UserType);
		UserType.hasMany(User);

		// ClientUser, User

		ClientUser.belongsTo(User);
		ClientUser.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(ClientUser);

		// Contact, Client

		Contact.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(Contact);

		// Collect, Client

		Collect.belongsTo(Client, {onDelete: 'CASCADE'});
		Client.hasMany(Collect);

		// Client, System

		Client.belongsToMany(System, {
			through: ClientSystem,
			as: 'systems',
			foreignKey: 'client_id',
			otherKey: 'system_id'
		});

		System.belongsToMany(Client, {
			through: ClientSystem,
			as: 'clients',
			foreignKey: 'system_id',
			otherKey: 'client_id'
		});

		Client.hasMany(ClientSystem, {foreignKey: 'client_id'});
		ClientSystem.belongsTo(Client, {foreignKey: 'client_id', onDelete: 'CASCADE'});

		System.hasMany(ClientSystem, {foreignKey: 'system_id' });
		ClientSystem.belongsTo(System, {foreignKey: 'system_id'});

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
			System,
			Collect,
			ClientSystem,
			CollectSystem,
			Parameter,
			CollectSystemParameter
		});
	}
	
	return {
		setUp
	};
};
